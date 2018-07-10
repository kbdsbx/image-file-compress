# Image File Compress

Minifiy and cut down image in the browser when it is so large.
Then it will solve that image uploads by iOS is rotated with gyroscope.

## Install

```
npm install image-file-compress --save
```

## Usage

```js
import compress from 'compress';
```

```js
compress( '[src]', {
    rotate : true,
    zoom: true,
    max_width: 800,
    max_height: 600,
} )
.then( res => {
    // res.path : <base64>
    // res.data : <blob>
} );;
```

or just only:

```js
compress( '[src]', {
    max_width: 800,
} ).then( <then> );
```

- The ``[src]`` use string as URL or File object from ``input[type='file']``, etc.
