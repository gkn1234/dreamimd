import { BaseItem, BaseItemOptions } from '../base';
import type { Imd } from './Imd';

/**
 * 动作状态：
 * - tap 单点
 * - slide 滑动
 * - hold 长按
 */
export type ImdActionType = 'hold' | 'slide' | 'tap';

/**
 * 持续长按的状态：
 * - none 非系列长按动作
 * - start 系列长按动作的开始
 * - end 系列长按动作的结束
 * - move 系列长按动作的过程
 */
export type ImdHoldState = 'start' | 'move' | 'end' | 'none';

export interface ImdHoldNodes {
  /** 系列长按的头结点 */
  start: ImdItem | null;

  /** 系列长按的尾结点 */
  end: ImdItem | null;

  /** 系列长按的下一个节点 */
  next: ImdItem | null;

  /** 系列长按的前一个节点 */
  prev: ImdItem | null;
}

export interface ImdItemOptions extends BaseItemOptions {
  /** {@link ImdActionType} */
  type?: ImdActionType;

  /** 动作起始轨道的索引 */
  startPosition?: number;

  /** 长按持续时间，单位：ms */
  duration?: number;

  /**
   * 滑动偏移轨道数：
   * - 0 - 非滑动
   * - -x - 向左滑动 x 个轨道
   * - x - 向右滑动 x 个轨道
   */
  slideOffset?: number;
}

export class ImdItem
  extends BaseItem<Imd, ImdItemOptions>
  implements Required<ImdItemOptions> {
  /** 合法的动作类型 */
  static validTypes: ImdActionType[] = ['hold', 'slide', 'tap'];

  type: ImdActionType = 'tap';

  startPosition = 0;

  duration = 0;

  slideOffset = 0;

  /** 长按结束时间 */
  get endTime() {
    return this.time + this.duration;
  }

  /** 动作结束轨道索引 */
  get endPosition() {
    return this.startPosition + this.slideOffset;
  }

  /**
   * 生成一个单点
   * @param map 元素关联的谱面
   * @param time 时间戳
   * @param pos 单点所在轨道索引
   * @returns 单点实例
   */
  static createTap(map: Imd, time: number, pos: number) {
    return new ImdItem(map, {
      type: 'tap',
      time,
      startPosition: pos,
    });
  }

  /**
   * 生成一个单滑键
   * @param map 元素关联的谱面
   * @param time 时间戳
   * @param pos 滑键所在轨道索引
   * @param offset 滑键滑动方向与范围
   * @returns 滑键实例
   */
  static createSlide(map: Imd, time: number, pos: number, offset: number) {
    return new ImdItem(map, {
      type: 'slide',
      time,
      startPosition: pos,
      slideOffset: offset,
    });
  }

  /**
   * 生成一个长按
   * @param map 元素关联的谱面
   * @param time 时间戳
   * @param pos 长按所在轨道索引
   * @param duration 长按持续时间
   * @returns 长按实例
   */
  static createHold(map: Imd, time: number, pos: number, duration: number) {
    return new ImdItem(map, {
      type: 'hold',
      time,
      startPosition: pos,
      duration,
    });
  }

  /**
   * 生成一系列长按
   * @param map 元素关联的谱面
   * @param time 时间戳
   * @param pos 滑键所在轨道索引
   * @param actions
   */
  static createHolds(
    map: Imd,
    time: number,
    pos: number,
    beginWithHold: boolean,
    actions: number[],
  ) {
    // 只有一个动作，不足以创建系列长按
    if (actions.length < 2) {
      throw new Error('hold series must have at least 2 actions!');
    }

    const header = beginWithHold ?
      ImdItem.createHold(map, time, pos, actions[0]) :
      ImdItem.createSlide(map, time, pos, actions[0]);
    header.holdStart();

    for (let i = 1; i < actions.length; i++) {
      const action = actions[i];
      const prev = header.holdNodes.end;
      if (!prev) {
        throw new Error('error exists while creating hold series!');
      }

      const current = prev.type === 'slide' ?
        ImdItem.createHold(map, prev.endTime, prev.endPosition, action) :
        ImdItem.createSlide(map, prev.endTime, prev.endPosition, action);
      header.holdPush(current);
    }
    return header.holdSeries;
  }

  /** {@link ImdHoldState} */
  protected holdState: ImdHoldState = 'none';

  /** 系列长按的节点 */
  protected holdNodes: ImdHoldNodes = {
    start: null,
    end: null,
    next: null,
    prev: null,
  };

  /** 获取系列长按节点列表 */
  protected get holdSeries() {
    const results: ImdItem[] = [];
    for (let cur = this.holdNodes.start; cur; cur = cur.holdNodes.next) {
      results.push(cur);
    }
    return results;
  }

  protected holdStart() {
    this.holdNodes.start = this;
    this.holdNodes.end = this;
    this.holdState = 'start';
  }

  protected holdPush(node: ImdItem) {
    const target = node;
    const { start } = this.holdNodes;
    if (
      !start ||
      start.holdState !== 'start' ||
      !start.holdNodes.end
    ) {
      throw new Error('can not find avaliable hold start node!');
    }

    const prev = start.holdNodes.end;
    target.holdState = 'end';
    target.holdNodes.start = start;
    target.holdNodes.end = target;
    target.holdNodes.prev = prev;

    if (start !== prev) {
      prev.holdState = 'move';
    }
    prev.holdNodes.end = target;
    prev.holdNodes.next = target;

    start.holdNodes.end = target;
  }

  /** @override */
  protected validate(options: ImdItemOptions) {
    this.validateTime(options);
    this.validateType(options);
    this.validateDuration(options);
    this.validateStartPosition(options);
    this.validateSlideOffset(options);
  }

  /** 检验动作类型 */
  protected validateType(options: ImdItemOptions) {
    const { type } = options;
    if (type === undefined) return;
    if (!ImdItem.validTypes.includes(type)) {
      throw new Error(`Invalid action type: ${type}`);
    }
  }

  /** 检验长按的持续时间 */
  protected validateDuration(options: ImdItemOptions) {
    const {
      duration,
      // type、time 已完成校验
      type = this.type,
      time = this.time,
    } = options;
    if (duration === undefined) return;

    if (typeof duration !== 'number' || duration < 0) {
      throw new Error('duration must be positive number!');
    }

    // 非长按不允许有持续时间
    if (type !== 'hold') {
      throw new Error('duration can only be set in hold item!');
    }

    // 检验最终时间是否超出谱面的时间范围
    const { duration: mapDuration } = this.map;
    const endTime = time + duration;
    if (endTime < 0 || endTime > mapDuration) {
      throw new Error('end time can not exceed the timerange of the map!');
    }
  }

  /** 检验动作的开始位置 */
  protected validateStartPosition(options: ImdItemOptions) {
    const { startPosition } = options;
    if (startPosition === undefined) return;
    if (typeof startPosition !== 'number') {
      throw new Error('start position must be non-negative number!');
    }

    const { key } = this.map;
    if (startPosition >= key) {
      throw new Error('start position can not exceed the key!');
    }
  }

  /** 检查滑动方向和范围 */
  protected validateSlideOffset(options: ImdItemOptions) {
    const {
      slideOffset,
      // type、startPosition 已完成校验
      type = this.type,
      startPosition = this.startPosition,
    } = options;
    if (slideOffset === undefined) return;

    if (typeof slideOffset !== 'number') {
      throw new Error('slide offset must be a number!');
    }

    // 非滑键不允许有滑动方向
    if (type !== 'slide') {
      throw new Error('slide offset can only be set in slide item!');
    }

    // 检验最终时间位置是否超出轨道范围
    const { key } = this.map;
    const endPosition = startPosition + slideOffset;
    if (endPosition < 0 || endPosition >= key) {
      throw new Error('end position can not exceed the key!');
    }
  }
}
