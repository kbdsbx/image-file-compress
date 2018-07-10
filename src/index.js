import compress from '../lib/compress';
import url from 'url'

window.onload = function() {
    var file = document.getElementById( 'file' );
    file.onchange = function( e ) {
        var path = file.files[0];
        compress( path, {
            max_width: 80,
            max_height: 80,
        } ).then( res => {
            var img = document.getElementById( 'img' );
            img.src = res.path;
        } );
    }

    compress( url.resolve( location.origin, './test/0064.jpg' ), {
        max_width: 800,
    } ).then( res => {
        var img2 = document.getElementById( 'img2' );
        img2.src = res.path;
    } )
}