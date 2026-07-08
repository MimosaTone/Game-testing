import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.generateTextures();
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }

  private generateTextures(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });

    gfx.fillStyle(0xffffff);
    gfx.fillCircle(16, 16, 16);
    gfx.generateTexture('circle', 32, 32);
    gfx.clear();

    gfx.lineStyle(2, 0xffffff, 0.4);
    gfx.strokeCircle(16, 16, 16);
    gfx.generateTexture('bond-ring', 32, 32);
    gfx.clear();

    gfx.fillStyle(0xffffff);
    gfx.fillRect(0, 0, 8, 8);
    gfx.generateTexture('particle', 8, 8);
    gfx.destroy();
  }
}
