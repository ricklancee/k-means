'use strict';

const getPixels = require('get-pixels');

module.exports = function pallete() {
  const MAX_CENTROIDS = 6;

  const load = function load(image) {
    return new Promise((resolve, reject) => {
      getPixels(image, (err, pixels) => {
        if (err) {
          reject(err);
        }

        resolve(pixelsToHsl(pixels));
      });
    });
  };

  const pixelsToHsl = function pixelsToHsl(pixels) {
    const width = pixels.shape[0];
    const height = pixels.shape[1];
    const hslVals = [];

    for(let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        hslVals.push(rgbToHsl(
          pixels.data[index],
          pixels.data[index + 1],
          pixels.data[index + 2]
        ));
      }
    }

    return hslVals;
  };

  const rgbToHsl = function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h;
    let s;
    let l = (max + min) / 2;

    if (max == min) {
      h = s = 0;
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {h, s, l};
  };

  const quantize = function quantize(hslVals, centroids = MAX_CENTROIDS) {
    let clusters = null;
    let previousClusterValues;

    while(convergenceIsNotMet(clusters, previousClusterValues)) {
      previousClusterValues = cloneClusters(clusters);
      clusters = positionClusters(clusters, centroids, previousClusterValues);
      clusters = assignPointsToClusters(clusters, hslVals);
    }

    const colors = [];

    for(let cluster in clusters) {
      const medianClusterColor = calculateMedianClusterColor(clusters[cluster].points);
      colors.push(medianClusterColor);
    }

    return colors;
  };

  const positionClusters = function positionClusters(clusters, centroids, previousClusterValues) {
    if (!clusters)
      clusters = {};

    let newClusters = {};
    for (let i = 0; i < centroids; i++) {
      const centroidPosition = !previousClusterValues ?
        getRandomCentroidPosition() :
        calculateCentroidByPoints(clusters[i].points);

      newClusters[i] = {
        position: centroidPosition,
        points: []
      };

    }

    return newClusters;
  };

  const assignPointsToClusters = function assignPointsToClusters(clusters, points) {
    for (let point of points) {
      let distanceToCentroids = [];

      for (let cluster in clusters) {
        const distance = calculateDistanceBetweenTwoVectors(point, clusters[cluster].position);
        distanceToCentroids.push(distance);
      }

      const closestDistance = Math.min(...distanceToCentroids);
      const indexOfClosestCentroid = distanceToCentroids.indexOf(closestDistance);

      clusters[indexOfClosestCentroid].points.push(point);
    }

    return clusters;
  };

  const convergenceIsNotMet = function convergenceIsNotMet(clusters, previousClusterValues) {
    if (!previousClusterValues)
      return true;

    for (let cluster in clusters) {
      if (clusters[cluster].points.length !== previousClusterValues[cluster].points.length) {
        console.log('No convergence...');
        return true;
      }
    }

    console.log('Convergence found...');

    return false;
  };

  const cloneClusters = function cloneClusters(clusters) {
    // Not neccesseraly the best implementation of deep clone
    return JSON.parse(JSON.stringify(clusters));
  };

  const calculateCentroidByPoints = function calculateCentroidByPoints(points) {
    let avgH = 0;
    let amountH = 0;
    let avgS = 0;
    let amountS = 0;
    let avgL = 0;
    let amountL = 0;

    points.forEach(point => {
      avgH += point.h;
      amountH++;
      avgS += point.s;
      amountS++;
      avgL += point.l;
      amountL++;
    });

    return {
      h: avgH / amountH,
      s: avgS / amountS,
      l: avgL / amountL
    };
  };

  const getRandomCentroidPosition = function getRandomCentroidPosition() {
    return {
      h: Math.round( Math.random() * 10 ) / 10,
      s: Math.round( Math.random() * 10 ) / 10,
      l: Math.round( Math.random() * 10 ) / 10
    }
  };

  const calculateDistanceBetweenTwoVectors = function(v1, v2) {
    const dh = v1.h - v2.h;
    const ds = v1.s - v2.s;
    const dl = v1.l - v2.l;

    return Math.sqrt( dh * dh + dl * dl + ds * ds );
  };

  const calculateMedianClusterColor = function calculateMedianClusterColor(points) {
    const avgPoint = calculateCentroidByPoints(points);

    const pointDistance = [];

    points.forEach(point => {
      const distance = calculateDistanceBetweenTwoVectors(avgPoint, point);
      pointDistance.push({
        point,
        distance
      });
    });

    const sortedPoints = pointDistance.sort((a, b) => {
      return a.distance - b.distance;
    });

    return {
      h: Math.round(sortedPoints[0].point.h * 360),
      s: Math.round(sortedPoints[0].point.s * 100),
      l: Math.round(sortedPoints[0].point.l * 100),
    };
  };

  const orderByLuminace = function orderByLuminace(colors) {
    return colors.sort((a, b) => {
      return a.l - b.l;
    });
  };

  return {
    load,
    quantize,
    orderByLuminace
  }
};
