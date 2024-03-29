---
url: writing-a-webgl-program
title: Writing a WebGL Shader
published: 2021-05-14
description: Getting started with WebGL Shaders using three.js and GLSL
img: https://res.cloudinary.com/dqrv3tasx/image/upload/v1677949072/webgl_phuqyb.png
editLink: https://github.com/OwnKng/ownkng.dev-content/blob/main/articles/writing-a-webgl-program/writing-a-webgl-program.md
tags:
  - WebGL
  - Web dev
  - Featured
---

<iframe src='https://components.ownkng.dev/circle'></iframe>

[Three.js](https://threejs.org/), the most popular JavaScript library for creating three dimensional scenes and visualisations in a web browser, is an incredibly powerful tool. Some of the most eye-catching uses of three.js, however, rely on custom shaders. These shaders use [WebGL](https://www.khronos.org/webgl/), the low-level JavaScript API that three.js is built on, to manipulate the points and colors of three.js meshes and generate effects and patterns.

The colorful circle that appears on this page is an example of a custom WebGL shader. This article explains how it was built.

## What is a shader?

A shader is simply a small programme that draw something to a user's screen. These programmes are executed on a device's Graphics Processing Unit (GPU), which are designed to run many operations in parallel. This allows shaders to generate complex visual effects involving millions of calculations very quickly.

WebGL shaders are written in a programming language called [GLSL](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language) (OpenGL Shading Language), a typed language that is similar in syntax to C. There are two types of shaders in WebGL: vertex shaders and fragment shaders.

Vertex shaders manipulate coordinates in 3D space and are called once for every vertex. They return a value for the `gl_Position` variable, an in-built GLSL variable that describes how to project each vertex's position along the x, y and z axes.

Fragment shaders define the colors for each pixel being processed and are called once per pixel. Fragment shaders set an in-built `gl_FragColor` variable, which describes the RBGA (Red, Green, Blue and Alpha) values for each pixel.

### Using shaders in three.js

Three.js's in-built materials - such as [`MeshStandardMaterial`](https://threejs.org/docs/#api/en/materials/MeshStandardMaterial) or [`MeshPhongMaterial`](https://threejs.org/docs/?q=meshp#api/en/materials/MeshPhongMaterial) - are all built using WebGL shaders. Three.js also provides two materials, [`RawShaderMaterial`](https://threejs.org/docs/?q=shader#api/en/materials/RawShaderMaterial) and [`ShaderMaterial`](https://threejs.org/docs/?q=shader#api/en/materials/ShaderMaterial), which allow us to define our own WebGL shader. When using either of these materials, we supply our own vertex and fragment shaders.

## Writing a WebGL shader

We'll be writing the circular shader that appears on the top of this page. The starter code is available [here](https://codesandbox.io/s/webgl-shader-starter-88193), and the finished version is [here](https://codesandbox.io/s/webgl-shader-zi5nf?file=/src/script.js). I've also implemented this shader in [React Three Fiber](https://github.com/pmndrs/react-three-fiber), a popular Three.js renderer for React. The code for this is available in this [GitHub repo](https://github.com/OwnKng/r3f-webgl-shader).

Let's take a look at the starter code. In the `script.js` file, we're creating a simple three.js scene with a [`PlaneGeometry`](https://threejs.org/docs/?q=planeg#api/en/geometries/PlaneGeometry). We also create a `ShaderMaterial`, passing it the `vertexShader` and `fragmentShader` that we've saved in the _src/shaders_ directory and import at the top of our file.[^1]

While our shaders are written in GLSL, we've placed them inside [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals). This will allow us to easily extend our code with functions written by other developers, while keeping our shaders relatively clean.

In our _script.js_ file, we provide these shaders to `ShaderMaterial`, which is then combined with our geometry in a three.js [`Mesh`](https://threejs.org/docs/#api/en/objects/Mesh), which we add to our scene.

At the moment, our vertex and fragment shaders are extremely simple. Inside the `main()` function, which we must include in both shaders, we're simply setting values for the in-built `gl_Position` and `gl_FragColor` variables.

Let's tweak these values to get a feel for how these shaders work. We'll start by modifying the `gl_FragColor` variable to set the color of each pixel to red.

```glsl
void main() {
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}`
```

`gl_FragColor` is a [vec4](https://thebookofshaders.com/glossary/?search=vec4) type - it comprises a vector of four decimal numbers. In this case, these numbers represent the Red, Green Blue, and Alpha values of each pixel respectively.

Let's look at the vertexShader. Our vertexShader contains a several variables that three.js's `ShaderMaterial` provides for us. These are:

- **`projectionMatrix`**. A [4x4 matrix](https://thebookofshaders.com/glossary/?search=mat4) that transforms our vertex coordinates into coordinates for the visible area of our scene.
- **`modelViewMatrix`**. A 4x4 matrix that is used to calculate the position of each vertex.
- **`position`**. A [vec3](https://thebookofshaders.com/glossary/?search=vec3) describing the x, y and z coordinates of each vertex in our mesh.

We don't need to consider the `projectionMatrix` or `modelViewMatrix` in our code. We'll only be modifying the positions of the vertices. Unfortunately, we can't modify the `position` variable directly - so we'll make a copy of it, then pass this copy of it into our vertex shader.

Let's modify our vertex shader like so.

```glsl
void main() {
  vec3 transPosition = position;

  float distortion = sin(transPosition.x * 5.0);

  transPosition.z = transPosition.z + distortion;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transPosition, 1.0);
}
```

Our mesh's z coordinates have now been modified so that they're placed according to the sine wave of each vertices' x coordinate, multiplied by a constant of five.

Increasing this value will narrow the bands of the sine waves, making our mesh more spiky. We can also use the y position of each vertex. Changing our `distortion` variable to the following will make our mesh look like waves or mountains.

```glsl
float distortion = sin(transPosition.x * 2.0) + cos(transPosition.y * 1.5);
```

## Supplying shaders with `uniforms`

In GLSL, [`uniforms`](https://thebookofshaders.com/glossary/?search=uniform) are inputs we supply to the shader to use in our programmes. These inputs are the same for each vertex or pixel and can be floating point numbers, vectors, matrices or other [data types](<https://www.khronos.org/opengl/wiki/Data_Type_(GLSL)>).

Three.js allows us to supply uniforms inside our `ShaderMaterial`. For instance, let's supply a `uTime` uniform, which we'll use to animate our mesh.

Modify the declaration of `material` as follows.

```js
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
  },
})
```

Then, inside the `frame()` function add the following code to update the value of our `uTime` uniform based on the elapsed time.

```js
const frame = () => {
  requestAnimationFrame(frame)

  // Update uTime uniform
  const elapsedTime = clock.getElapsedTime()
  material.uniforms.uTime.value = elapsedTime

  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)
}
```

Each time the frame function runs (around 60 times per second), it will update the value of `uTime` that's passed to the shader.

We can now use this in our vertex shader by declaring our `uniform`. Add the following code to the vertex shader before the `main()` function.

```glsl
uniform float uTime;
```

Now update the value of the `distortion` variable to use our uniform `uTime`.

```glsl
 float distortion = sin(transPosition.x * 2.0 + uTime) + cos(transPosition.y * 1.5 + uTime);
```

Our mesh's z positions now animate using the value of `uTime` in the calculations.

## Using `varying` to pass data between our shaders

In our vertex shader, we've calculated a value for the `distortion` variable for each vertex. What if we also wanted to use this value to color our pixels? How can we pass `distortion` to our fragment shader?

GLSL provides a variable type - [`varying`](https://thebookofshaders.com/glossary/?search=varying) - for exactly this use case. To use a varying, we first declare it in our vertex shader, outside of the `main()` function. Let's declare a new varying of type float called `vDistortion`.

```glsl
varying float vDistortion;
```

Then inside our `main()` function, we set the value of `vDistortion` to the value of the `distortion` variable.

```glsl
vDistortion = distortion;
```

To use this value in our fragment shader, we also need to declare it at the top of our file like we did in the vertex shader. We can then use it inside our `main()` function. Our fragment shader should now look like this.

```glsl
varying float vDistortion;

void main() {
  gl_FragColor = vec4(vDistortion, vDistortion, vDistortion, 1.0);
}
```

The tops of our waves are now bright white, and the depths are black. It's not a particularly attractive effect yet, because the value of our `vDistortion` actually falls outside of the acceptable range of 0 to 1. We'll address this shortly.

## Using a noise algorithm

[Noise algorithm](https://thebookofshaders.com/11/) create patterns by introducing some pseudo-random distortion (or noise) to input values. The returned results aren't entirely random: Two similar numbers run through a noise algorithm will still be close to each other when processed, but with a little more variability. This has the effect of producing very natural looking patterns.

There are several algorithms for generating noise. One of the most widely used was written by Stefan Gustavson and is distributed under an MIT license. The code is freely available here: https://github.com/ashima/webgl-noise/blob/master/src/classicnoise2D.glsl.

We're going to add this code into our vertex shader. Because we're using template literals, we can save Stefan's code in a separate constant, and then add it our vertex shader using string interpolation.

Our _vertex.js_ file should now look something like this.

```js
const pnoise = `
 // Insert code from https://github.com/ashima/webgl-noise/blob/master/src/classicnoise2D.glsl
`

export const vertex = `
  uniform float uTime;
  varying float vDistortion;

  ${pnoise}

  void main () {
    ...
  }
`
```

The pnoise function takes two vec3s and returns a float. Let's use this in our declaration of the `distortion` variable.

```glsl
float distortion = pnoise(sin(transPosition + uTime * 0.5) * 2.0, vec3(10.0));
```

Noise values range from negative one to positive one, so after we calculate the distortion value we'll also want to rescale it so that the values are between zero and one.

```
distortion = distortion * 0.5 + 0.5;
```

The z positions of our mesh now undulate nicely using our noise values.

## Coloring our shader

We can also use the values returned from our noise algorithm to color our fragments. One way to do this would be to turn the values of our `vDistortion` varying into Hue, Saturation and Lightness (HSL) values.

Creative coder and generative artist [Matt DesLauriers](https://www.mattdesl.com/) has written a function in GLSL to do this, which he's distributed under MIT license [here](https://github.com/Jam3/glsl-hsl2rgb/blob/master/index.glsl).

As we did with Stephan's noise algorithm, we'll add Matt's code into our _fragment.js_ file. We can then pass to the `hls2rgb()` function the value of our `vDistortion` variable as the 'h' parameter. We'll keep the saturation and light values at 0.5 to give our colors a pastel look.

Our fragment shader should now look like this.

```js
const hsl2rgb = `
    // hsl2rgb written by Matt DesLauriers - https://github.com/Jam3/glsl-hsl2rgb/blob/master/index.glsl
    float hue2rgb(float f1, float f2, float hue) {
        if(hue < 0.0)
            hue += 1.0;
        else if(hue > 1.0)
            hue -= 1.0;
        float res;
        if((6.0 * hue) < 1.0)
            res = f1 + (f2 - f1) * 6.0 * hue;
        else if((2.0 * hue) < 1.0)
            res = f2;
        else if((3.0 * hue) < 2.0)
            res = f1 + (f2 - f1) * ((2.0 / 3.0) - hue) * 6.0;
        else
            res = f1;
        return res;
    }

    vec3 hsl2rgb(vec3 hsl) {
        vec3 rgb;

        if(hsl.y == 0.0) {
            rgb = vec3(hsl.z); // Luminance
        } else {
            float f2;

            if(hsl.z < 0.5)
                f2 = hsl.z * (1.0 + hsl.y);
            else
                f2 = hsl.z + hsl.y - hsl.y * hsl.z;

            float f1 = 2.0 * hsl.z - f2;

            rgb.r = hue2rgb(f1, f2, hsl.x + (1.0 / 3.0));
            rgb.g = hue2rgb(f1, f2, hsl.x);
            rgb.b = hue2rgb(f1, f2, hsl.x - (1.0 / 3.0));
        }
        return rgb;
    }

    vec3 hsl2rgb(float h, float s, float l) {
        return hsl2rgb(vec3(h, s, l));
    }
`

export const fragmentShader = `
varying float vDistortion;

${hsl2rgb}

void main() {
  vec3 color = hsl2rgb(vDistortion, 0.5, 0.5);

  gl_FragColor = vec4(color, 1.0);
}`
```

As the value of our `vDistortion` variable ranges from zero to one, the `hsl2rgb()` function returns a rather psychedelic range of colors. We can constrain the range of possible colors, however, by multiplying `vDistortion` by a constant. Let's limit the range of `vDistortion` to 0.4.

```glsl
  vec3 color = hsl2rgb(vDistortion * 0.4, 0.5, 0.5);
```

We can also add a constant to set a base color. The code below will contain our hue value from 0.4 to 0.8 - producing a mix of blue colors.

```glsl
  vec3 color = hsl2rgb(0.4 + vDistortion * 0.4, 0.5, 0.5);
```

## Modifying our shape using alpha

Our shader so far has a nice noise effect and a range of colors. However, it's square shape is somewhat uninspiring.

At the moment, our fragment shader sets the alpha parameter to 1.0 for all the pixels in our mesh. However, we can manipulate this value to make parts of our mesh transparent - and thus change the shape.

To do this, we're going to make use of the uv coordinates of our mesh. The uv coordinates are the x and y coordinates of our mesh - but expressed as decimals ranging from (0, 0) [the bottom left] to (1, 1) [the top right]. Three.js's `ShaderMaterial` provides these for us in the vertex shader, but as we want these in the fragment shader we'll declare a new `varying` in _vertex.js_ and then pass it to our fragment shader.

Our vertex shader should now look like this.

```glsl
uniform float uTime;

varying float vDistortion;

// Declare a new varing vec2
varying vec2 vUv;

${pnoise}

void main() {
  vec3 transPosition = position;

  float distortion = pnoise(sin(transPosition + uTime * 0.5) * 2.0, vec3(10.0));
  distortion = distortion * 0.5 + 0.5;

  transPosition.z += distortion;

  vDistortion = distortion;

  // Pass it to the fragment shader
  vUv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transPosition, 1.0);
}
```

We also need to declare the `vUv` in the fragment shader by adding the following line to the top of the shader.

```glsl
varying float vDistortion;
```

Let's now use this value in our `main()` function. We'll declare a new float variable, `alpha`, which we'll set using the in-built [`step()`](https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/step.xhtml) function.

```glsl
float alpha = 1.0 - step(0.05, abs(distanc (vUv, vec2(0.5, 0.5)) - 0.4));
```

There's a lot going on in this line. Let's start by looking at the `step()` function. This function takes two numeric parameters - `edge` and `x`. If the value of `edge` is greater than that of `x`, step will return 0. Otherwise, it will return 1.

Our x parameter will be based on another GLSL function - [`distance()`](https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/distance.xhtml). As its name implies, `distance()` simply calculates the distance between two points. We're supplying our vUv coordinates for each pixel and the middle of our mesh (0.5, 0.5). We then subtract 0.4 from the returned distances and take the absolute value, which returns those values at the outer edge of our mesh. We supply this returned value as the x parameter to our `step()` function.

Finally, we invert the values returned from the `step()` function so that alpha is 1 where `step()` returned 0 and 0 where `step()` returned 1.

As with many aspects of shaders, I would recommend tweaking some of the values in this line to get a feel for what this code is doing.

We'll then supply alpha to gl_FragColor.

```glsl
    gl_FragColor = vec4(color, alpha);
```

Finally, we need to return to our _script.js_ file to set the transparent option of our `ShaderMaterial` to `true`. This simply means that the `ShaderMaterial` will respect the alpha values returned from our fragment shader.

```glsl
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 }
  },
  // set transparent to true
  transparent: true
});
```

This produces our nice wavy circle.

## Wrap up

Writing WebGL shaders is hard. It not only relies on an understanding of mathematical concepts from trigonometry, but because there's no `console.log()` in GLSL, it's difficult to debug your shader when it's not working as expected. The constant values I've used to modify the positions and colors used in the circle shader, for instance, were primarily the result of a lot of trial and error.

Despite this, there's definitely something really enjoyable about using code and mathematical concepts to produce artistic and beautiful visualisations. Shaders are also something with a certain 'wow' factor that, even when used around the margins of a website or application, can create really impactful experiences.

### Learn more about WebGL shaders

In learning about WebGL shaders I've found the following resources extremely helpful.

- **[Bruno Simon's](https://bruno-simon.com/)** fabulous **[three.js journey](https://threejs-journey.xyz/)** course, which provides extensive material about all about aspects of three.js and WebGL, including shaders.
- **[Matt DesLauriers](https://www.mattdesl.com/)** has two excellent courses on creative coding on **[Frontend Masters](https://frontendmasters.com/teachers/matt-deslauriers/)**. Matt has also written a **[fantastic guide](https://mattdesl.github.io/workshop-webgl-glsl/#/)** to WebGL and GLSL.
- **[Patricio Gonzalez Vivo](http://patriciogonzalezvivo.com/)** and **[Jen Lowe's](http://jenlowe.net/)** e-book **[The Book of Shaders](https://thebookofshaders.com/)** is a very comprehensive guide to the topic.
- Creative coder **[Varun Vachhar](https://varun.ca/)** recently wrote an **[fantastic article](https://varun.ca/noise/)** on noise algorithms with lots of useful demos.

[^1]: I've used a `ShaderMaterial` rather than a `RawShaderMaterial` because the former provides a lot of hidden uniforms and attributes that makes the process of writing shaders simpler.
