const pallet = require('./pallete')();
const fs = require('fs');

const arg = process.argv[2];
const image = arg ? arg.substring(arg.indexOf('--image=') + 8) : false;

if (!image) {
  console.error('Please provide an image with the --image flag');
  process.exit(1);
}

pallet.load(image)
  .then(pixels => pallet.quantize(pixels))
  .then(colors => pallet.orderByLuminace(colors))
  .then(swatches => {
    console.log(swatches);
    const template = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title></title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>body{margin:0;padding:0;width:100vw;display:flex;flex-wrap:wrap;}div{width:25vw;height:25vw;}</style>
        </head>
        <body>
          ${swatches.reduce((prev, color) => {
            return prev + `<div class="swatch"
              style="background-color: hsl(${ color.h }, ${ color.s }%, ${ color.l }%);"></div>
            `;
          }, '')}
        </body>
      </html>`;

      fs.writeFile('./swatch.html', template, 'utf8');
  });


