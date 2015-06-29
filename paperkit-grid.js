/*
@license
Copyright (c) The PaperKit Authors. All rights reserved.
This code may only be used under the BSD style license found at http://http://paperkit.github.io/LICENSE.txt
The complete set of authors may be found at http://paperkit.github.io/AUTHORS.txt
The complete set of contributors may be found at http://paperkit.github.io/CONTRIBUTORS.txt
*/
var PaperKit = PaperKit || {};

PaperKit.Tools = (function() {
  var whichTransitionEvent = function() {
    var t,
    el = document.createElement("fakeelement");

    var transitions = {
      "transition"      : "transitionend",
      "OTransition"     : "oTransitionEnd",
      "MozTransition"   : "transitionend",
      "WebkitTransition": "webkitTransitionEnd"
    }
    
    for (t in transitions){
      if (el.style[t] !== undefined){
        return transitions[t];
      }
    }
  }
  
  return {
    transitionEvent: whichTransitionEvent()
  };
})();

PaperKit.Grid = function(items, options) {
  this.options = options;
  for (var k in this.defaults) {
    if (!this.options.hasOwnProperty(k)) {
      this.options[k] = this.defaults[k];
    }
  }
  this.items = items;
  for(var i=0, length=items.length; i < length; i++) {
    this.items[i].id = i;
  }
}

PaperKit.Grid.prototype = {
  defaults: {
    layout: 'vertical'    
  },
  initGrid: function() {
    this.items.sort(this.sortItemsInLayoutFunction.bind(this));
    this.items.forEach(this.positionItemFunction.bind(this));
  },
  sortItemsInLayoutFunction: function(item1, item2) {
    // Sort depending on layout...
    if(this.options.layout=='vertical') {
      if(item1.top != item2.top) {
        return item1.top - item2.top;
      }
      if(item1.left != item2.left) {
        return item1.left - item2.left;
      }
    } else {
      if(item1.left != item2.left) {
        return item1.left - item2.left;
      }
      if(item1.top != item2.top) {
        return item1.top - item2.top;
      }        
    }
    
    return 0;
  },
  sortItemsInPositionFunction: function(item1, item2) {
    if(item1.position && item2.position) {
      return item1.position - item2.position;
    }
  },
  positionItemFunction: function(item, index) {
    var position = this.findPositionForItem(item, index);
    this.updateItemPosition(item, position);
  },  
  findPositionForItem: function(item, index) {
    // Basic responsiveness :-)...
    if(item.width > this.options.cols) {
      item.width = this.options.cols;
    }    
    
    if(this.options.layout=='vertical') {
      if(item.left + item.width > this.options.cols) {
        item.left = this.options.cols - item.width;
      }      
      if(item.left < 0) {
        item.left = 0;
      }      
    } else {
      if(item.top + item.height > this.options.rows) {
        item.top = this.options.rows - item.height;
      }
      if(item.top < 0) {
        item.top = 0;
      }
    }
    
    var position = { x: item.left, y: item.top };
    var max = 0;
    
    for(var i=0; i<index; i++) {
      var item2 = this.items[i];
      
      if(this.options.layout=='vertical') {
        if(!(item2.left >= item.left + item.width || item2.left + item2.width <= item.left)) {
          var height = item2.top + item2.height;        
          max = height > max? height : max;
        }
      } else {
        if(!(item2.top >= item.top + item.height || item2.top + item2.height <= item.top)) {
          var width = item2.left + item2.width;        
          max = width > max ? width : max;          
        }
      }
    }
    
    if(this.options.layout=='vertical') {
      position.y = max;
    } else {
      position.x = max;
    }    
    
    return position;
  },
  updateItemPosition: function(item, position) {
    item.left = position.x;
    item.top = position.y;
  },
  collides: function(item1, item2) {
    return !(
      item2.left >= item1.left + item1.width ||  // item2 to the right side of item1
      item2.top >= item1.top + item1.height ||   // item2 below item1
      item2.left + item2.width <= item1.left ||  // item2 to the left of item1
      item2.top + item2.height <= item1.top      // item2 above item1
    );
  },
  moveElement: function(index, position) {
    var item = this.items.filter(function(item) {
      return item.id===index;
    })[0];
    
    item.left = position.x;
    item.top = position.y;
    
    this.initGrid();
    console.log(this.toString());
  },
  replaceElement: function(element, newelement) {
    for(var i=0, length = this.items.length; i < length; i++) {
      if(this.items[i]===element) {
        this.items[i] = newelement;
        break;
      }
    }
  },
  positionItemInGrid: function(item, grid) {
    this.fixGridSize(grid, item.left + item.width, item.top + item.height);    
    for(var x = item.top, mX = item.top + item.height; x < mX; x++) {
      for(var y = item.left, mY = item.left + item.width; y < mY; y++) {
        grid[x][y] = item.id;
      }
    }
  },
  fixGridSize: function(grid, cols, rows) {
    for(var x=0; x<rows; x++) {
      grid[x] = !grid[x] ? [] : grid[x];
      for(var y=0; y<cols; y++) {
        grid[x][y] = !grid[x][y] ? null : grid[x][y];
      }
    }
  },  
  pad: function(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  },
  toString: function() {
    var grid = [];
    
    for(var i=0, length =this.items.length; i < length; i++) {
      this.positionItemInGrid(this.items[i], grid);
    }
    
    var output = '';
    var border = '';
    
    for(var x=0, mX = grid.length; x < mX; x++) {
      if(x==0) {
        output += '  ';
        border += '   ';
        
        for(var y = 0, mY = grid[x].length; y < mY; y++) {
          output += this.pad(y,2,' ');
          border += '__';
        }
        output += '\n' + border;
      }
      
      output += '\n' + this.pad(x, 2, ' ') + '|';
      for(var y = 0, mY = grid[x].length; y < mY; y++) {
        output += grid[x][y] ? this.pad(grid[x][y],2,'0') : '--';
      }
    }
    return output + '\n';
  }
};