"use strict";

/*
    ADAPTED FROM
    https://github.com/tholman/intense-images/

    Under The MIT License (MIT)
*/

window.requestAnimFrame =
    window.requestAnimationFrame    || window.webkitRequestAnimationFrame || 
    window.mozRequestAnimationFrame || function(e) { window.setTimeout(e, 1000 / 60); }; 

window.cancelRequestAnimFrame = 
    window.cancelAnimationFrame           || window.webkitCancelRequestAnimationFrame || 
    window.mozCancelRequestAnimationFrame || window.oCancelRequestAnimationFrame      || 
    window.msCancelRequestAnimationFrame  || clearTimeout;

var big = (function(){
    var mouse            = { xCurr: 0, yCurr: 0, xDest: 0, yDest: 0 };
    var xOrient          = true, invertInit = false, active = false;
    var lastPosition     = 0, currentPosition = 0;
    var targetDimensions = { w: 0, h: 0 };
    var parentDim        = { w: 0, h: 0 };
    var overflowArea     = { x: 0, y: 0 };
    var overflowValue    = null, container = null, target = null, srcDim = null, looper = null;

    function ex(target, source){
        for (var key in source) if (!(key in target)) target[key] = source[key];
        return target;
    }

    function _apply(target, properties){ for (var key in properties) target.style[key] = properties[key]; }

    function _fit(source){
        var heightRatio = window.innerHeight / source.h;
        if((source.w * heightRatio) > window.innerWidth) return { w: source.w * heightRatio, h: source.h * heightRatio, fit: true };
        else {
            var widthRatio = window.innerWidth / source.w;
            return { w: source.w * widthRatio, h: source.h * widthRatio, fit: false };
        }
    }

    function initTrack(passedElements){
        if (passedElements.length) for (var i = 0; i < passedElements.length; i++) track(passedElements[i]); 
        else track(passedElements);
    }

    function track(element){  
        if (element.getAttribute('data-image') || element.src || element.href){
            element.addEventListener('click', function(e) {
                if (element.tagName === 'A') e.preventDefault(); 
                if (!active) init(this);
            }, false );
        }
    }

    function loop(){
        looper = requestAnimFrame(loop);
        posTar();
    }

    function setState(element, newClassName){
        if (element){
            element.className = element.className.replace('big--loading', ''), element.className = element.className.replace('big--viewing', '');
            element.className += " " + newClassName;
        } 
        else {
            var elems = $('.big--viewing');
            [].forEach.call(elems, function(el) { el.className = el.className.replace('big--viewing', '').trim(); });
        }
    }

    function initView(){
        var containerProperties = {
            'backgroundColor': 'rgba(0,0,0,0.8)', 'width': '100%', 'height': '100%', 'position': 'fixed', 'top': '0', 'left': '0', 
            'overflow': 'hidden', 'zIndex': '999999', 'margin': '0', 'webkitTransition': 'opacity 150ms cubic-bezier( 0, 0, .26, 1 )', 
            'MozTransition': 'opacity 150ms cubic-bezier( 0, 0, .26, 1 )', 'transition': 'opacity 150ms cubic-bezier( 0, 0, .26, 1 )', 
            'webkitBackfaceVisibility': 'hidden', 'opacity': '0'
        };
        container = document.createElement('figure'), container.appendChild(target);
        _apply(container, containerProperties);
        setDim();
        mouse.xCurr = mouse.xDest = window.innerWidth / 2, mouse.yCurr = mouse.yDest = window.innerHeight / 2;
        document.body.appendChild(container);
        setTimeout(function(){ container.style['opacity'] = '1'; }, 10);
    }

    function delView(){
        document.body.style.overflow = overflowValue;
        container.removeEventListener('mousemove', onMouseMove, false), container.removeEventListener('touchmove', onTouchMove, false);
        window.removeEventListener('resize', setDim, false), target.removeEventListener('click', delView, false);
        cancelRequestAnimFrame(looper);
        document.body.removeChild(container);
        active = false;
        setState(false);
    }

    function setDim(){
        var imageDimensions = _fit(srcDim);
        target.width        = imageDimensions.w, target.height = imageDimensions.h, xOrient = imageDimensions.fit;
        targetDimensions    = { w: target.width, h: target.height };
        parentDim           = { w: window.innerWidth, h: window.innerHeight };
        overflowArea        = { x: parentDim.w - targetDimensions.w, y: parentDim.h - targetDimensions.h };
    }

    function init(element){
        setState(element, 'big--loading');
        var imageSource = element.src;
        var img = new Image();
        img.onload = function(){
            srcDim = { w: img.width, h: img.height };
            target = this;
            initView();
            overflowValue = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            container.addEventListener('mousemove', onMouseMove, false), container.addEventListener('touchmove', onTouchMove, false);
            window.addEventListener('resize', setDim, false), target.addEventListener('click', delView,  false);
            loop();
            setState(element, 'big--viewing');
        }
        img.src = imageSource;
    }

    function onMouseMove(e){ mouse.xDest = e.clientX, mouse.yDest = e.clientY; }
    function onTouchMove(e){ e.preventDefault(), mouse.xDest = e.touches[0].clientX, mouse.yDest = e.touches[0].clientY; }

    function posTar(){
        mouse.xCurr += (mouse.xDest - mouse.xCurr) * 0.05, mouse.yCurr += (mouse.yDest - mouse.yCurr) * 0.05;
        if (xOrient === true){
            currentPosition += (mouse.xCurr - currentPosition);
            if (mouse.xCurr !== lastPosition){
                var position = parseFloat(calcPos(currentPosition, parentDim.w));
                position = overflowArea.x * position;
                target.style['webkitTransform'] = 'translate(' + position + 'px, 0px)';
                target.style['MozTransform']    = 'translate(' + position + 'px, 0px)';
                target.style['msTransform']     = 'translate(' + position + 'px, 0px)';
                lastPosition = mouse.xCurr;
            }
        } 
        else if (xOrient === false){
            currentPosition += (mouse.yCurr - currentPosition);
            if (mouse.yCurr !== lastPosition) {
                var position = parseFloat( calcPos(currentPosition, parentDim.h));
                position = overflowArea.y * position;
                target.style['webkitTransform'] = 'translate( 0px, ' + position + 'px)';
                target.style['MozTransform']    = 'translate( 0px, ' + position + 'px)';
                target.style['msTransform']     = 'translate( 0px, ' + position + 'px)';
                lastPosition = mouse.yCurr;
            }
        }
        function calcPos(cur, tot){ return invertInit ? (tot - cur) / tot : cur / tot; }
    }
    
    return ex(initTrack, { resize: setDim, start: loop, stop: cancelRequestAnimFrame(looper) });
})();
