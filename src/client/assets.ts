/*const ASSET_NAMES = [
  'ship.svg',
  'bullet.svg',
];

const assets: { [key: string]: any }  = {};


export const downloadAssets(): any {
  return Promise.all(ASSET_NAMES.map(downloadAsset));
}

function downloadAsset(assetName: string) {
  return new Promise(resolve => {
    const asset = new Image();
    asset.onload = () => {
      console.log(`Downloaded ${assetName}`);
      assets.assetName = asset;
      resolve();
    };
    asset.src = `/assets/${assetName}`;
  });
}


export const getAsset = assetName => assets[assetName];*/