(function($){
  'use strict';
  
  var defaults = {
    opacity: {
      original: 0,
      clone: 1
    },
    zIndex: 1000,
    // parent or selector 
    appendTo: 'body',
    scrollElement: 'parent',
    delay: 300
  },
  
  callbacks = (function(){
    var cb = [ ];
    return {
      push: function(fn) {
        cb.push(fn);
      },
      fire: function() {
        while(cb.length) {
          var fn = cb.shift();
          fn();
        }
      }
    };
  })(),
  
  methods = {
    init: function(options) {
      var selector = this.selector;
      
      options = $.extend(true, defaults, options);
      
      $('body')
        .on('mouseenter.fullimage', selector, function(e) {
          var $target = $(e.currentTarget),
            timerId = setTimeout(function() {
              $target.off('mouseleave.fullimage');
              callbacks.fire();
              methods.enter.call($target, options, e);
            }, options.delay);
          
          $target.one('mouseleave.fullimage', function(e) {
            clearTimeout(timerId);
          });
        });
    },
    teardown: function(options) {
      $('body').off('mouseenter.fullimage');
      callbacks.fire();
    },
    enter: function(options, e) {
      return this.each(function() {
        var $this = $(this),
          // parent which has scroll bar
        $scroll = options.scrollElement === 'parent' ? 
          $this.parent() : $this.parents(options.scrollElement),
        
        _offset = $this.offset(),
        offset = {
          top: _offset.top + $scroll.scrollTop(),
          left: _offset.left + $scroll.scrollLeft()
        },
        metrics = {
          top: offset.top,
          bottom: offset.top + $this.outerHeight(),
          left: offset.left,
          right: offset.left + $this.outerWidth(),
        },
        scrollOffset = $scroll.offset(),
        $clone = $this
          .css({
            opacity: options.opacity.original
          })
          .clone()
            // TODO - another strategy
            .removeClass('collapsed')
            .css({
              position: 'absolute',
              top: metrics.top - scrollOffset.top - safeParseInt($scroll.css('border-top-width')),
              left: metrics.left - scrollOffset.left - safeParseInt($scroll.css('border-left-width')),
              width: $this.width(),
              opacity: options.opacity.clone,
  //            padding: 0,
              margin: 0,
              zIndex: options.zIndex,
              scrollElement: options.scrollElement
            })
            .appendTo(options.appendTo),
            
        data = {
          $target: $this,
          $clone: $clone,
          $scroll: $scroll,
          metrics: metrics,
          options: options
        };
        // for mouseleave by scroll
        data.clientX = e.clientX;
        data.clientY = e.clientY;
        
        callbacks.push(function() {
          $this.css('opacity', '');
          $clone.remove();
          $scroll.off('mousemove.fullimage');
          $scroll.off('scroll.fullimage');
        });
        
        setTimeout(function() {
          $scroll.on('mousemove.fullimage', data, mouseMoveHandler);
          $scroll.on('scroll.fullimage', data, scrollHandler);
        }, 30);
      });
    }
  },
  
  safeParseInt = function(val) {
    return parseInt(val) || 0;
  },
  
  isOutOfBound = function(rect, x, y) {
    return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
  },
  
  mouseMoveHandler = function(e) {
    var data = e.data,
      $scroll = data.$scroll,
      
      x = e.clientX + $scroll.scrollLeft(),
      y = e.clientY + $scroll.scrollTop();
    
    data.clientX = e.clientX;
    data.clientY = e.clientY;
    if(isOutOfBound(data.metrics, x, y)) {
      callbacks.fire();
    }
  },
  
  scrollHandler = function(e) {
    var data = e.data,
      $scroll = data.$scroll,
      x = data.clientX + $scroll.scrollLeft(),
      y = data.clientY + $scroll.scrollTop();
    
    if(isOutOfBound(data.metrics, x, y)) {
      callbacks.fire();
    }
  },
  
  fullImage = function(method) {
    if( methods[method] ) {
      return methods[method].apply(this, Array.prototype.slice.call( arguments, 1 ));
    } else if( typeof method === 'object' || !method ){
      return methods['init'].apply(this, arguments);
    } else {
      $.error( 'Method ' +  method + ' is invalid' );
    }
  };
  
  fullImage.defaults = defaults;
  $.fn.fullImage = fullImage
})(jQuery);
