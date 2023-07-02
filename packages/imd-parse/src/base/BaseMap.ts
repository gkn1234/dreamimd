export interface BaseMapOptions {
  /** 谱面名称 */
  name?: string;

  /** 谱面难度 */
  difficulty?: string;

  /** 谱面时长，单位：ms */
  duration?: number;

  /** 谱面全局 bpm */
  bpm?: number;
}

/** 基本谱面信息 */
export class BaseMap implements Required<BaseMapOptions> {
  name = '';

  duration = 0;

  bpm = 150;

  difficulty = 'ez';

  constructor(options: BaseMapOptions = {}) {
    Object.assign(this, options);
  }
}
