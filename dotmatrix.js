/*global Vue */
'use strict';

const PI2 = Math.PI * 2;

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
      hue: 0,
      saturation: 0,
      luminance: 100,
      contexts: {
        lumSat: null,
        hue: null
      },
      lumSatCoords: [0, 0],
      hueCoord: 0
    };
  },
  computed: {
    hsla: function () {
      return `hsla(${this.hue}, ${this.saturation}%, ${this.luminance}%, 1)`;
    }
  },
  watch: {
    hsla: function (newHsla) {
      this.$emit('change', newHsla);
    }
  },
  methods: {
    lumSatInput: function (evt) {
      var lum, sat;
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

      lum = this.lumFromCoordsInRect(x, y, rect.width, rect.height);
      sat = x / rect.width;
      this.luminance = Math.round(lum * 100);
      this.saturation = Math.round(sat * 100);
    },
    hueInput: function (evt) {
      var x;
      var rect = this.hueRect;

      if (evt.buttons !== 1 && evt.type === 'mousemove') return;

      x = evt.clientX - 10 - rect.left;
      x = Math.min(x, rect.width);
      x = Math.max(x, 0);
      this.hueCoord = x;
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
    rgbFromHsl: function (h, s, l) {
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
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    },

    lumFromCoordsInRect: function (x, y, w, h) {
      return ((h - y) / h) * (1 - (x / w) / 2);
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
      var hue = (this.hue / 360);
      var lum, sat;

      for (y = 0; y < height; y += 1) {
        for (x = 0; x < width; x += 1) {
          sat = x / width;
          lum = this.lumFromCoordsInRect(x, y, width, height);
          rgb = this.rgbFromHsl(hue, sat, lum);
          pixels[offset] =     rgb[0];
          pixels[offset + 1] = rgb[1];
          pixels[offset + 2] = rgb[2];
          pixels[offset + 3] = 255;
          offset += 4;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      ctx.beginPath();
      ctx.strokeStyle = '#fff';
      ctx.arc(mouseX, mouseY, 5, 0, PI2);
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
  props: ['backgroundColor', 'scaleToFit', 'imageSize', 'dotSize', 'spacing'],
  data: function () {
    return {
      isDragging: false,
      image: null,
      context: null,
      marginLeft: '0',
      marginTop: '0',
      scaledCanvas: document.createElement('canvas'),
      renderedImage: null
    };
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
    renderDots: function () {
      var ctx = this.context;
      var canvas = ctx.canvas;
      var source = this.scaledImageData;
      var pixels;
      var x, y;
      var dx, dy;
      var offset = 0;
      var scale = this.dotSize + this.spacing/2;

      if (!this.image) return;

      canvas.width = source.width * scale;
      canvas.height = source.height * scale;
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      this.marginLeft = -(canvas.width / 2) + 'px';
      this.marginTop = -(canvas.height / 2) + 'px';

      pixels = source.data;

      for (y = 0; y < source.height; y += 1) {
        for (x = 0; x < source.width; x += 1) {
          ctx.fillStyle = `rgb(${pixels[offset]}, ${pixels[offset + 1]}, ${pixels[offset + 2]})`;
          dx = x * scale + scale/2;
          dy = y * scale + scale/2;
          ctx.beginPath();
          ctx.arc(dx, dy, this.dotSize / 2, 0, PI2);
          ctx.fill();
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

      evt.preventDefault();
      if (this.renderedImage) return;

      this.image = new Image();
      this.image.onload = function () {
        URL.revokeObjectURL(this.src);
        matrix.isDragging = false;
        matrix.renderDots();
        matrix.$emit('has-image');
      };
      this.image.src = URL.createObjectURL(file);
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
  }
});

var app = new Vue({
  el: '#app',
  data: {
    imageSize: 16,
    spacing: 20,
    dotSize: 20,
    backgroundColor: 'hsl(0, 0%, 100%)',
    scaleToFit: true,
    hasLoadedImage: false
  },
  methods: {
    setBackgroundColor: function (hslColor) {
      this.backgroundColor = hslColor;
    },
    saveImage: function () {
      this.$refs.matrix.createImage();
    },
  },
  updated: function () {
    // For some reason this doesn't happen automatically when changing most
    // data properties, only backgroundColor.
    this.$refs.matrix.$forceUpdate();
  }
});
