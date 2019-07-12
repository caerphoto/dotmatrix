/*global Vue */
'use strict';

const PI2 = Math.PI * 2;
const PADDING = 10;

// var eventbus = new Vue();

function getTextOf(id) {
  var el = window.document.getElementById(id);
  if (!el) {
    throw new Error('No element with ID "' + id + '" found.');
  }
  return el.innerHTML;
}

Vue.component('color-picker', {
  template: getTextOf('template-color-picker'),
  data: function () {
    return {
      hue: Math.floor(Math.random() * 360),
      saturation: 0,
      luminance: 100,
      contexts: {
        lumSat: null,
        hue: null
      },
      lumSatCoords: [0, 0]
    };
  },
  computed: {
    hsla: function () {
      return {
        hue: this.hue,
        saturation: this.saturation,
        luminance: this.luminance
      };
    },
    maxRgb: function () {
      return this.rgbFromHsl(this.hue / 360, 1, 0.5, true);
    },
    hueCoord: function () {
      return this.hue * (this.$refs.hueCanvas.width / 360);
    }
  },
  watch: {
    hsla: function (newHsla) {
      this.$emit('change', newHsla);
    }
  },
  methods: {
    lumSatInput: function (evt) {
      var rgb, sl;
      var x, y;
      var rect = this.lumSatRect;

      if (evt.buttons !== 1 && evt.type === 'mousemove') return;

      x = evt.clientX - 10 - rect.left;
      y = evt.clientY - 10 - rect.top;
      x = Math.min(x, rect.width);
      x = Math.max(x, 0);
      y = Math.min(y, rect.height);
      y = Math.max(y, 0);
      this.lumSatCoords = [x, y];
      this.renderLumSat();

      rgb = this.rgbFromCoordsInRect(x, y, rect.width, rect.height, true);
      sl = this.slFromRgb(rgb[0], rgb[1], rgb[2]);

      this.saturation = Math.round(sl[0] * 100);
      this.luminance = Math.round(sl[1] * 100);
    },
    hueInput: function (evt) {
      var x;
      var rect = this.hueRect;

      if (evt.buttons !== 1 && evt.type === 'mousemove') return;

      x = evt.clientX - 10 - rect.left;
      x = Math.min(x, rect.width);
      x = Math.max(x, 0);
      this.hue = Math.round((x / rect.width) * 360);
      this.renderLumSat();
      this.renderHue();
    },

    // I don't know how these two functions work, I just copied them from
    // https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
    rgbFromHue: function (p, q, t) {
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1/6) return p + (q - p) * 6 * t;
      if(t < 1/2) return q;
      if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    },
    rgbFromHsl: function (h, s, l, asFloatingPoint) {
      var r, g, b;
      var p, q;

      if (s === 0) {
        r = g = b = l;
      } else {
        q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        p = 2 * l - q;
        r = this.rgbFromHue(p, q, h + 1/3);
        g = this.rgbFromHue(p, q, h);
        b = this.rgbFromHue(p, q, h - 1/3);
      }
      if (asFloatingPoint) {
        return [r, g, b];
      } else {
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
      }
    },
    slFromRgb: function (r, g, b) {
      r /= 255; g /= 255; b /= 255;
      var max = Math.max(r, g, b);
      var min = Math.min(r, g, b);
      var sat;
      var lum = (max + min) / 2;
      var d;

      if (max === min) return [0, lum]; // achromatic

      d = max - min;
      sat = lum > 0.5 ? d / (2 - max - min) : d / (max + min);
      return [sat, lum];
    },

    rgbFromCoordsInRect: function (x, y, w, h) {
      var [mr, mg, mb] = this.maxRgb;
      var sx = x / w;
      var sy = 1 - y / h;

      // Buncha linear interpolation magic.
      var r = ((1 - sx) * 1 + sx * mr) * sy;
      var g = ((1 - sx) * 1 + sx * mg) * sy;
      var b = ((1 - sx) * 1 + sx * mb) * sy;

      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    },

    renderLumSat: function () {
      var x, y;
      var [mouseX, mouseY] = this.lumSatCoords;
      var ctx = this.contexts.lumSat;
      var width = this.$refs.lumSatCanvas.width;
      var height = this.$refs.lumSatCanvas.height;
      var imageData = ctx.createImageData(width, height);
      var pixels = imageData.data;
      var offset = 0;
      var rgb;

      for (y = 0; y < height; y += 1) {
        for (x = 0; x < width; x += 1) {
          rgb = this.rgbFromCoordsInRect(x, y, width, height);
          pixels[offset] =     rgb[0];
          pixels[offset + 1] = rgb[1];
          pixels[offset + 2] = rgb[2];
          pixels[offset + 3] = 255;
          offset += 4;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.arc(mouseX - 0.7, mouseY - 0.7, 6.7, 0, PI2);
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = '#fff';
      ctx.arc(mouseX-0.5, mouseY - 0.5, 5, 0, PI2);
      ctx.stroke();
    },
    renderHue: function () {
      var ctx = this.contexts.hue;
      var width = this.$refs.hueCanvas.width;
      var height = this.$refs.hueCanvas.height;
      var imageData = ctx.createImageData(width, height);
      var pixels = imageData.data;
      var rgb;
      var hue = 0;
      var offset = 0;
      var y;
      var mouseX = this.hueCoord;

      for (y = 0; y < height; y += 1) {
        for (hue = 0; hue < width; hue += 1) {
          rgb = this.rgbFromHsl(hue / width, 1, 0.5);
          pixels[offset] =     rgb[0];
          pixels[offset + 1] = rgb[1];
          pixels[offset + 2] = rgb[2];
          pixels[offset + 3] = 255;
          offset += 4;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      ctx.fillStyle = '#fff';
      ctx.fillRect(mouseX - 1, 0, 2, height);
    },

    initCanvasRect(canvas) {
      var rect = canvas.getBoundingClientRect();
      rect.width -= 20;
      rect.height -= 20;
      canvas.width = rect.width;
      canvas.height = rect.height;

      return rect;
    }
  },
  mounted: function () {
    this.contexts.lumSat = this.$refs.lumSatCanvas.getContext('2d');
    this.contexts.hue = this.$refs.hueCanvas.getContext('2d');
    this.contexts.hue.fillStyle = '#fff';

    this.lumSatRect = this.initCanvasRect(this.$refs.lumSatCanvas);
    this.hueRect = this.initCanvasRect(this.$refs.hueCanvas);

    this.renderLumSat(0, 0);
    this.renderHue();
  }
});

Vue.component('image-viewer', {
  template: getTextOf('template-image-viewer'),
  props: ['image'],
  computed: {
    visible: function () {
      return !!this.image;
    }
  },
  methods: {
    insertImage: function () {
      Array.from(this.$refs.imageHolder.children).forEach(function (el) {
        el.parentNode.removeChild(el);
      });
      this.$refs.imageHolder.appendChild(this.image);
    }
  },
  updated: function () {
    if (this.image) this.insertImage();
  }
});

Vue.component('matrix', {
  template: getTextOf('template-matrix'),
  props: ['backgroundColor', 'useSquares', 'shrinkToFit', 'imageSize', 'dotSize', 'gridSize'],
  data: function () {
    return {
      isDragging: false,
      image: null,
      isImageLoaded: false,
      context: null,
      marginLeft: '0',
      marginTop: '0',
      scaledCanvas: document.createElement('canvas'),
      renderedImage: null,
      isMounted: false,
      scaledWidth: 'auto',
      containerRect: null,
      canvasWidth: 0,
      canvasHeight: 0
    };
  },
  watch: {
    shrinkToFit: function () {
      this.$refs.container.scrollTo(0, 0);
    },
    canvasWidth: function (newWidth) {
      this.$emit('size-change', newWidth, this.canvasHeight);
    }
  },
  computed: {
    scaledImageData: function () {
      var canvas = this.scaledCanvas;
      var ctx = canvas.getContext('2d');
      var ratio;

      if (!this.image) return;

      if (this.image.width > this.image.height) {
        ratio = this.image.width / this.image.height;
        canvas.width = this.imageSize;
        canvas.height = Math.max(Math.round(this.imageSize / ratio), 1);
      } else {
        ratio = this.image.height / this.image.width;
        canvas.width = Math.max(Math.round(this.imageSize / ratio), 1);
        canvas.height = this.imageSize;
      }

      ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height);
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    },
    hasRenderedImage: function () {
      return !!this.renderedImage;
    }
  },
  methods: {
    getContainerRect: function () {
      if (!this.containerRect) {
        this.containerRect = this.$refs.container.getBoundingClientRect();
      }
      return this.containerRect;
    },
    getCanvasScale: function () {
      var rect;
      var scaleX, scaleY;
      var finalScale;

      if (!this.shrinkToFit) return { x: 1, y: 1, overall: 1 };

      rect = this.getContainerRect();
      scaleX = rect.width / (this.canvasWidth + 50);
      scaleY = rect.height / (this.canvasHeight + 50);
      finalScale = Math.min(Math.min(scaleX, scaleY), 1);

      return {
        x: scaleX,
        y: scaleY,
        overall: finalScale
      };
    },
    renderDots: function () {
      var ctx = this.context;
      var canvas = ctx.canvas;
      var source = this.scaledImageData;
      var pixels;
      var rect;
      var x, y;
      var dx, dy;
      var offset = 0;
      var scale = this.gridSize;
      var SQUARE_OFFSET = this.useSquares ? this.dotSize / 2 : 0;
      var canvasScale;

      if (!this.image) return;

      rect = this.getContainerRect();
      this.canvasWidth = canvas.width = source.width * scale + PADDING * 2;
      this.canvasHeight = canvas.height = source.height * scale + PADDING * 2;
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      canvasScale = this.getCanvasScale();

      if (canvas.width * canvasScale.x  > rect.width) {
        this.marginLeft = '0';
      } else {
        this.marginLeft = ((rect.width - canvas.width) / 2) + 'px';
      }
      if (canvas.height * canvasScale.y > rect.height) {
        this.marginTop = '0';
      } else {
        this.marginTop = ((rect.height - canvas.height) / 2) + 'px';
      }
      this.scaledWidth = `${canvas.width * canvasScale.overall - 20}px`;

      pixels = source.data;

      for (y = 0; y < source.height; y += 1) {
        for (x = 0; x < source.width; x += 1) {
          ctx.fillStyle = `rgb(${pixels[offset]}, ${pixels[offset + 1]}, ${pixels[offset + 2]})`;
          dx = x * scale + scale/2 + PADDING - SQUARE_OFFSET;
          dy = y * scale + scale/2 + PADDING - SQUARE_OFFSET;
          if (this.useSquares) {
            ctx.fillRect(dx, dy, this.dotSize, this.dotSize);
          } else {
            ctx.beginPath();
            ctx.arc(dx, dy, this.dotSize / 2, 0, PI2);
            ctx.fill();
          }
          offset += 4;
        }
      }
    },
    startDragging: function () {
      if (this.renderedImage) return;
      this.isDragging = true;
    },
    handleDragOver: function (evt) {
      evt.preventDefault();
    },
    loadImageFromDrop: function (evt) {
      var matrix = this;
      var file = evt.dataTransfer.files[0];
      var image;

      evt.preventDefault();
      if (this.renderedImage) return;

      image = new Image();
      image.onload = function () {
        URL.revokeObjectURL(this.src);
        matrix.image = this;
        matrix.isDragging = false;
        matrix.renderDots();
        matrix.$emit('has-image');
      };
      image.src = URL.createObjectURL(file);
    },
    stopDragging: function () {
      this.isDragging = false;
    },
    createImage: function () {
      var matrix = this;

      this.context.canvas.toBlob(function (blob) {
        var img = document.createElement('img');
        var url = URL.createObjectURL(blob);
        img.onload = function () {
          matrix.renderedImage = img;
        };
        img.src = url;
      });
    },
    destroyImage: function () {
      URL.revokeObjectURL(this.renderedImage.src);
      this.renderedImage = null;
    },
    loadTestImage: function () {
      var matrix = this;
      var image = new Image();
      image.onload = function () {
        matrix.image = this;
        matrix.isDragging = false;
        matrix.renderDots();
        matrix.$emit('has-image');
      };
      image.src = 'dot-matrix-sample-image.jpg';
    }
  },
  updated: function () {
    this.context = this.$refs.output.getContext('2d');
    this.renderDots();
    if (this.renderedImage) {
      this.$emit('previewing');
    } else {
      this.$emit('no-preview');
    }
  },
  mounted: function () {
    var matrix = this;
    this.isMounted = true;

    setTimeout(function () {
      matrix.$forceUpdate();
      matrix.loadTestImage();
    }, 100);
  }
});

var app = new Vue({
  el: '#app',
  data: {
    detail: 20,
    gridSize: 20,
    dotSize: 16,
    hue: 0,
    saturation: 0,
    luminance: 100,
    alphaPercent: 100,
    useSquares: false,
    shrinkToFit: true,
    hasLoadedImage: false,
    connectSizes: false,
    gridDotRatio: 1,
    outputWidth: 0,
    outputHeight: 0
  },
  computed: {
    alpha: function () {
      return this.alphaPercent / 100;
    },
    backgroundColor: function () {
      return `hsla(${this.hue}, ${this.saturation}%, ${this.luminance}%, ${this.alpha})`;
    },
  },
  methods: {
    setHSL: function (hsl) {
      this.hue = hsl.hue;
      this.saturation = hsl.saturation;
      this.luminance = hsl.luminance;
    },
    saveImage: function () {
      this.$refs.matrix.createImage();
    },
    updateSize: function (newWidth, newHeight) {
      this.outputWidth = newWidth;
      this.outputHeight = newHeight;
    },
    connectChange: function () {
      this.gridDotRatio = this.gridSize / this.dotSize;
    },
    gridSizeChange: function () {
      if (!this.connectSizes) return;

      this.dotSize = Math.round(this.gridSize / this.gridDotRatio);
    },
    dotSizeChange: function () {
      if (!this.connectSizes) return;

      this.gridSize = Math.round(this.dotSize * this.gridDotRatio);
    }
  },
  updated: function () {
    // For some reason this doesn't happen automatically when changing most
    // data properties, only backgroundColor.
    this.$refs.matrix.$forceUpdate();
  }
});
