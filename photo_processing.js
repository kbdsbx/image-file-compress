"use strict"

function photo_processing( opt ) {
    var _keys = Object.keys( this.options );
    for ( var i in _keys ) {
        var _k = _keys[i];
        this.options[_k] = opt[_k] || this.options[_k];
    }

    return this;
}

if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = photo_processing;
    }
    exports.photo_processing = photo_processing;
} else if ( typeof root !== 'undefined' ) {
    root.photo_processing = photo_processing;
}

photo_processing.prototype = {
    options : {
        rotate: true,
        zoom: true,

        zoom_width: 0,
        zoom_height: 0,
    },

    _set_args : function( img, args) {
        var _self = this;
        if ( _self.options.zoom ) {
            if ( _self.options.zoom_width && ! _self.options.zoom_height ) {
                args.width = _self.options.zoom_width;
                args.height = img.height * ( _self.options.zoom_width / img.width );
            } else if ( ! _self.options.zoom_width && _self.options.zoom_height ) {
                args.width = img.width * ( _self.options.zoom_height / img.height );
                args.height = _self.options.zoom_height;
            } else {
                args.width = img.width;
                args.height = img.height;
                args.cut_width = _self.options.zoom_width;
                args.cut_height = _self.options.zoom_height;
            }
        } else {
            args.width = img.width;
            args.height = img.height;
        }
    },

    processing : function ( img, callback ) {
        var _self = this;

        var _args = {
            width : 0,
            height : 0,
            cut_width: 0,
            cut_height: 0,
            rotate : 0, // deg
            mirror : false,
        }

        var reader = new FileReader();
        reader.readAsDataURL( img );
        reader.onload = function( reader_events ) {
            var _img = new Image();
            _img.src = reader_events.target.result;

            // ignore rotate when EXIF.js is not exists.
            if ( 'undefined' == typeof EXIF ) {
                _self.options.rotate = false;
            }

            if ( _self.options.rotate ) {
                _img.onload = function() {
                    EXIF.getData( _img, function() {
                        var _ori = EXIF.getTag( _img, 'Orientation' );
                        _self._set_args( _img, _args );
                        
                        switch ( _ori ) {
                        default:
                        case 1:
                            // do nothing;
                            break;
                        case 2:
                            _args.mirror = true;
                            break;
                        case 3:
                            _args.rotate = 180;
                            break;
                        case 4:
                            _args.rotate = 180;
                            _args.mirror = true;
                            break;
                        case 5:
                            _args.rotate = 90;
                            _args.mirror = true;
                            break;
                        case 6:
                            _args.rotate = 90;
                            break;
                        case 7:
                            _args.rotate = 270;
                            _args.mirror = true;
                            break;
                        case 8:
                            _args.rotate = 270;
                            break;
                        }

                        _self._transform( _img, _args, callback );
                    } );
                }
            } else {
                _img.onload = function() {
                    _self._set_args( _img, _args );
                    _self._transform( _img, _args, callback );
                }
            }
        }
    },

    _transform : function( _img, args, callback ) {
        var canvas = document.createElement( 'canvas' );
        canvas.width = ( ( args.rotate / 90 ) % 2 ) ? args.height : args.width;
        canvas.height = ( ( args.rotate / 90 ) % 2 ) ? args.width : args.height;
        var ctx = canvas.getContext( '2d' );

        if ( args.rotate ) {
            // 将坐标原地置于画布中心
            ctx.translate( canvas.width / 2, canvas.height / 2 );
            // 旋转角度
            ctx.rotate( args.rotate * Math.PI / 180 );
            // 将坐标原点还原至左上角
            if ( ( args.rotate / 90 ) % 2 ) {
                ctx.translate( -canvas.height / 2, -canvas.width / 2 );
            } else {
                ctx.translate( -canvas.width / 2, -canvas.height / 2 );
            }
        }

        if ( args.mirror ) {
            // 将坐标原地置于画布中缝
            ctx.translate( canvas.width / 2, 0 );
            // 镜像
            ctx.scale( -1, 1 );
            // 将坐标原点还原至左上角
            ctx.translate( -canvas.width / 2, 0 );
        }

        // 绘图
        ctx.drawImage( _img, 0, 0, _img.width, _img.height, 0, 0, args.width, args.height );

        // 裁剪
        var img_left = 0, img_top = 0;
        if ( args.cut_width && args.cut_height ) {
            if ( canvas.width / canvas.height > args.cut_width / args.cut_height ) {
                img_left = ( canvas.width - ( args.cut_width / args.cut_height * canvas.height ) ) / 2;
                img_top = 0;
             } else {
                img_left = 0;
                img_top = ( canvas.height - ( args.cut_height / args.cut_width * canvas.width ) ) / 2;
             }
        }

        // 输出
        var outer_canvas = document.createElement( 'canvas' );
        outer_canvas.width = args.cut_width || canvas.width;
        outer_canvas.height = args.cut_height || canvas.height;
        var outer_ctx = outer_canvas.getContext( '2d' );
        outer_ctx.drawImage( canvas, img_left, img_top, canvas.width - img_left * 2, canvas.height - img_top * 2, 0, 0, outer_canvas.width, outer_canvas.height );

        if ( callback ) {
            callback.call( _img, outer_canvas.toDataURL( 'image/png' ) );
        }
    }
};

if ( typeof define !== 'undefined' && define.amd ) {
    define( [], function() {
        return photo_processing;
    } );
}
