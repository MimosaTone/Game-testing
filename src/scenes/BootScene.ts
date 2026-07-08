import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.generateTextures();
    this.scene.start('SetupScene');
    this.scene.launch('UIScene');
    this.scene.sleep('UIScene');
  }

  private generateTextures(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 });

    gfx.fillStyle(0xffffff);
    gfx.fillCircle(16, 16, 16);
    gfx.generateTexture('circle', 32, 32);
    gfx.destroy();
  }
}
