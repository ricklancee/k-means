# K-means Color Quantization

An attempt at implementing a k-mean clustering algorithm. Inspired by [Paul Lewis's building a media player series](https://www.youtube.com/watch?v=P95ZDIzjg0Q) where he uses the median cut algorithm instead of k-means.

Notes:

- The implementation is probably flawed
- It's highly inefficient. I use way to many objects and likely unnessessary calculations.
- It was fun to make :)

How to run:

1. Install get-pixels from npm. `npm install get-pixels`
2. run program with `node pallete-test.js --image=animage.jpg`
3. It will output a `swatch.html` file in the directory.
