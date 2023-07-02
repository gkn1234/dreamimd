import { BaseMap, BaseMapOptions } from '../base';
import { ImdItem } from './ImdItem';

export interface ImdOptions extends BaseMapOptions {
  /**
   * 轨道数量
   *
   * 轨道索引规则：0 代表左数第 1 轨，n - 1 代表左数第 n 轨
   */
  key?: number;
}

export class Imd extends BaseMap implements Required<ImdOptions> {
  key = 4;

  /** 谱面的按键元素 */
  items: ImdItem[] = [];
}
