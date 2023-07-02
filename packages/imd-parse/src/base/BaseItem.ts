import type { BaseMap } from './BaseMap';

export interface BaseItemOptions {
  /** 动作时间戳，单位：ms */
  time?: number;
}

/**
 * 基本谱面元素
 * @param map 关联的谱面对象
 * @param options 基础配置
 */
export class BaseItem<
  Map extends BaseMap = BaseMap,
  Options extends BaseItemOptions = BaseItemOptions,
> implements Required<BaseItemOptions> {
  time = 0;

  /** 关联的谱面对象 */
  map: Map;

  constructor(map: Map, options: Options) {
    this.map = map;
    this.set(options);
  }

  /** 设置谱面信息 */
  protected set(options: Options) {
    this.validate(options);
    Object.assign(this, options);
  }

  /** 验证待设置的谱面信息 */
  protected validate(options: Options) {
    this.validateTime(options);
  }

  /**
   * 验证动作时间戳：
   * - 必须为数字
   * - 必须在设置的谱面时间内
   */
  protected validateTime(options: Options) {
    const { duration } = this.map;
    const { time } = options;
    if (time === undefined) return;
    if (typeof time !== 'number' || time < 0) {
      throw new Error('time must be non-negative number!');
    }
    if (time > duration) {
      throw new Error('time can not exceed the timerange of the map!');
    }
  }
}
