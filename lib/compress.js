import merge from 'merge'
import exif from 'exif-js'

class Compress {
    constructor ( src, options ) {
        this.options = merge( {
            rotate: true,
            zoom: true,
        
            max_width: 0,
            max_height: 0,
        }, options );
        this.src = src;
    }

    processing () {

        return new Promise( ( resolve, reject ) => {
            
            // from url
            if ( typeof this.src === 'string' ) {
                this.read_img( this.src )
                    .then( res => this.merge( res ) )
                    .then( res => this.transform( res ) )
                    .then( res => resolve( res ) );
            }
            // from file
            if ( this.src instanceof File ) {
                this.read_file( this.src )
                    .then( res => this.read_img( res ) )
                    .then( res => this.merge( res ) )
                    .then( res => this.transform( res ) )
                    .then( res => resolve( res ) );
            }
        } )
    }

    read_file( src ) {
        return new Promise ( ( resolve, reject ) => {
            var reader = new FileReader();
            reader.readAsDataURL( this.src );
            reader.onload = ( reader_res ) => {
                resolve( reader_res.target.result );
            }
        })
    }
    
    read_img ( src ) {
        return new Promise( ( resolve, reject ) => {
            var img = new Image();
            img.src = src;

            if ( this.options.rotate ) {
                img.onload = () => {
                    exif.getData( img, () => {
                        var ori = exif.getTag( img, 'Orientation' );
                        this.args = this.merge( img );

                        switch ( ori ) {
                        default:
                        case 1:
                            // do nothing;
                            break;
                        case 2:
                            args.mirror = true;
                            break;
                        case 3:
                            args.rotate = 180;
                            break;
                        case 4:
                            args.rotate = 180;
                            args.mirror = true;
                            break;
                        case 5:
                            args.rotate = 90;
                            args.mirror = true;
                            break;
                        case 6:
                            args.rotate = 90;
                            break;
                        case 7:
                            args.rotate = 270;
                            args.mirror = true;
                            break;
                        case 8:
                            args.rotate = 270;
                            break;
                        }
                        resolve ( img );
                    } )
                }
            } else {
                img.onload = () => {
                    this.merge( img );
                    resolve ( img );
                }
            }
        } )
    }


    transform ( args ) {
        let img = args.img;
    
        let canvas = document.createElement( 'canvas' );
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
        ctx.drawImage( img, 0, 0, img.width, img.height, 0, 0, args.width, args.height );
    
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
    
        var path = outer_canvas.toDataURL( 'image/png' );

        return new Promise( ( resolve, reject ) => {
            resolve( {
                path,
                data : this.convertBase64UrlToBlob( path )
            } )
        } );
    }

    
    merge ( img ) {
        var args = {
            width: 0,
            height: 0,
            cut_width: 0,
            cut_height: 0,
            rotate: 0,
            mirror: false,

            img : Image,
        }

        var options = this.options;

        if ( options.zoom ) {
            if ( options.max_width && ! options.max_height ) {
                args.width = options.max_width;
                args.height = img.height * (options.max_width / img.width);
            } else if ( ! options.max_width && options.max_height ) {
                args.width = img.width * ( options.max_height / img.height );
                args.height = options.max_height;
            } else {
                args.width = img.width;
                args.height = img.height;
                args.cut_width = options.max_width;
                args.cut_height = options.max_height;
            }
        } else {
            args.width = img.width;
            args.height = img.height;
        }

        args.img = img;

        return new Promise( ( resolve, reject ) => {
            resolve( args );
        } );
    }

    /**
     * 将以base64的图片url数据转换为Blob
     * @param urlData
     *   用url方式表示的base64图片数据
     */
    convertBase64UrlToBlob(urlData) {
        var arr = urlData.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {type:mime});
    }
}

var compress = function(
    src,
    options
) {
    var cps = new Compress( src, options );
    return cps.processing();
}

export default compress;
