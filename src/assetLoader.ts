// Ultra-Fidelity Asset Loader for Photorealistic Cyberpunk Textures and Sprites

import bgCityUrl from './assets/images/cyber_megacity_bg_1787338101053.jpg';
import heroUrl from './assets/images/cyber_ninja_hero_1787338119454.jpg';
import mutantUrl from './assets/images/mutant_bacteria_beast_1787338130291.jpg';
import portalUrl from './assets/images/cyber_exit_portal_1787338147298.jpg';
import bioCoreUrl from './assets/images/encrypted_bio_core_1787338160625.jpg';

export interface GameAssetLibrary {
  bgCity: HTMLImageElement;
  hero: HTMLImageElement;
  mutant: HTMLImageElement;
  portal: HTMLImageElement;
  bioCore: HTMLImageElement;
  isLoaded: boolean;
}

export const assetUrls = {
  bgCity: bgCityUrl,
  hero: heroUrl,
  mutant: mutantUrl,
  portal: portalUrl,
  bioCore: bioCoreUrl,
};

class AssetManager {
  private static instance: AssetManager;
  public assets: GameAssetLibrary;
  private loadedCount: number = 0;
  private totalCount: number = 5;

  private constructor() {
    this.assets = {
      bgCity: new Image(),
      hero: new Image(),
      mutant: new Image(),
      portal: new Image(),
      bioCore: new Image(),
      isLoaded: false,
    };

    this.initLoading();
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  private initLoading() {
    const checkLoaded = () => {
      this.loadedCount++;
      if (this.loadedCount >= this.totalCount) {
        this.assets.isLoaded = true;
      }
    };

    this.assets.bgCity.onload = checkLoaded;
    this.assets.bgCity.onerror = checkLoaded;
    this.assets.bgCity.src = bgCityUrl;

    this.assets.hero.onload = checkLoaded;
    this.assets.hero.onerror = checkLoaded;
    this.assets.hero.src = heroUrl;

    this.assets.mutant.onload = checkLoaded;
    this.assets.mutant.onerror = checkLoaded;
    this.assets.mutant.src = mutantUrl;

    this.assets.portal.onload = checkLoaded;
    this.assets.portal.onerror = checkLoaded;
    this.assets.portal.src = portalUrl;

    this.assets.bioCore.onload = checkLoaded;
    this.assets.bioCore.onerror = checkLoaded;
    this.assets.bioCore.src = bioCoreUrl;
  }
}

export const gameAssets = AssetManager.getInstance().assets;
