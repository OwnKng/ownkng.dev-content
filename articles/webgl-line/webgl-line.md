---
url: webgl-line
title: Scribbled lines in WebGL
published: 2022-04-02
description: Converting images to scribbled drawings using WebGL
editLink: https://github.com/OwnKng/ownkng.dev-content/blob/main/articles/webgl-line/webgl-line.md
tags:
  - WebGL
  - Web dev
  - Featured
img: https://res.cloudinary.com/dqrv3tasx/image/upload/v1677949073/webgl-line_oiwxox.png
---

<iframe src='https://components.ownkng.dev/scribbled'></iframe>

My hand writing could charitably be described as scribbled - and uncharitably as messy or illegible. I'm so used to writing on a laptop or phone that when I actually do use my hands to write something down, I tend to only attempt the general shape of the words and not be overly concerned with how letters are intended to join together or the exact order they're usually in. The same rules apply when I attempt to draw something.

While this isn't generally regarded as a good method of writing or drawing, it can occasionally produce an aesthetically pleasing effect. The model of the hands on this page is one example - the scribbled lines provide a good approximation of the hands' shape, while also creating eye-catching patterns as they overlap on top of each other.

This post describes how to create these sorts of effects using [React-three-fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction), a React renderer for [three.js](https://threejs.org/). The accompanying code is available in its entirety on [GitHub](https://github.com/OwnKng/scribbled-sketch).

## The approach

While the code on this page is relatively involved in places, the underlying logic is very simple. The sketch is created from the following steps:

1. **Generate an array of points for each pixel in an image**.
   We create an array using the position and color of each pixel in an image. We exclude those pixels which are too dark and map the point's z position to the intensity of the pixel's color.
2. **Create a series of lines through randomly sampling from the points array**.
   We draw lines through randomly sampling points and retaining those which are relatively close to each other. We repeat this process for the number of lines in our sketch.
3. **Draw each curve**.
   We create a component that takes the sampled points from each line and returns a three dimensional tube.
4. **Applying a shader**.
   We enhance the 3D effect of these tubes by coloring them according to their z-position - making those closer to the front appear brighter than those at the back. We do this through writing our own [WebGl shader](https://developer.mozilla.org/en-US/docs/Web/API/WebGLShader).

## Generating points from an image

While the hands above do have some three dimensional depth, the basis for the lines is actually a two dimensional image. We can infer depth from the intensity of the image's color and lighting.

The image used in the sketch is below and was sourced from [Unsplash](https://unsplash.com/photos/qKspdY9XUzs).

![](/thoughts/webgl-line/hands-original.jpg)

Every pixel within the image will be used as potential starting point for one of our lines. The original image (which is 6,240 pixels wide by 4,160 pixels tall) is far too large for us to use - as it would produce an enormous object in three.js and we would need to generate thousands of lines to approximate the hands' shape, which would likely crash our browser.

Fortunately, we can dramatically reduce the dimensions of the image without losing much of the original definition of the hands' shape. The image used in the this page is a tiny 300 by 182 pixels.

```js
// import the texture
const texture = useTexture("hands.png")

// destructure the width and height and calculate the number of points
const { width, height } = texture.image
const numberOfPoints = width * height
```

One challenge we have with our image at the moment is that the hands are set against a black background, which we want to exclude from our lines - otherwise we'll end up with a square mess of lines that won't show anything.

We can remove any points in the image which are too dark by extracting the color of any given pixel, and then excluding those points which are below a given threshold for color or lightness. The following code does this through creating a canvas element, extracting the colors of each pixel, and returning an array of positions where the pixel's red channel is greater the arbitrary color threshold[^1].

We also use the pixel's red channel to set the z position of the point. This will give our sketch a 3D effect.

```js
// generate positions for lighter areas of the image only
const positions = useMemo(() => {
  // create an arbitrary threshold
  const threshold = 80

  // get the color of each pixel of the image
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  canvas.width = width
  canvas.height = height

  ctx.scale(1, -1)
  ctx.drawImage(texture.image, 0, 0, width, height * -1)

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const originalColors = Float32Array.from(data)

  // create an array of positions where the original colors are greater than the threshold
  const positions = []

  for (let i = 0; i < numberOfPoints; i++) {
    if (originalColors[i * 4 + 0] >= threshold) {
      positions.push(
        new THREE.Vector3(
          i % width,
          Math.floor(i / width),
          originalColors[i * 4] / 20 // the z position of the points is also inferred from the originalColor's red channel
        )
      )
    }
  }

  // return the array
  return positions
}, [width, height, texture.image, numberOfPoints])
```

I've wrapped this code in a [useMemo()](https://reactjs.org/docs/hooks-reference.html#usememo) hook because the operation is computationally expensive and we don't want it re-running unless the underlying dependencies change.

## Create lines from randomly sampled points

Once we have an array of points we can randomly sample from this array to generate a starting point for each of our lines. The logic for this is as follows:

1. Sample a random point in the array of points
2. Sample another random point and measure the distance between them. If the distance is below a given threshold[^2], then retain the point and discard if not. Repeat this process for each point that's retained an arbitrary number of times (2,000 times in our code below).
3. Repeat the above steps for as many lines as we want to have in our drawing (200 times in our code below).

```js
const numberLines = 200
const maxDistance = 8
const sampleSize = 200

// sample the positions and generate an array of vertices for each line
const lines = useMemo(() => {
  const lines = []

  for (let i = 0; i < numberLines; i++) {
    const lineVertices = []
    let tempPosition = new THREE.Vector3()

    const randomPoint = new THREE.Vector3(
      ...positions[Math.floor(Math.random() * positions.length)]
    )

    tempPosition = randomPoint
    let previousPoint = tempPosition.clone()

    for (let i = 0; i < sampleSize; i++) {
      tempPosition = new THREE.Vector3(
        ...positions[Math.floor(Math.random() * positions.length)]
      )

      if (tempPosition.distanceTo(previousPoint) < maxDistance) {
        lineVertices.push(new THREE.Vector3(...tempPosition))
        previousPoint = tempPosition.clone()
      }
    }

    lines[i] = lineVertices
  }

  return lines
}, [positions, numberLines, maxDistance, sampleSize])
```

We now have an array of vertices of each line. We can use these vertices to draw our lines.

## Create the curve

With our array of line vertices, we can map through each element and return a line for each one. I've extracted this into a component which takes the vertices of each line as a prop, and then generates a three dimensional curve using the [CatmullRomCurve3()](https://threejs.org/docs/#api/en/extras/curves/CatmullRomCurve3) function from three.js.

```js
const Line = ({ vertices }: any) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(vertices), [vertices])

  return (
    <>
      <mesh>
        <tubeGeometry args={[curve, 100, 0.25, 12, false]} />
        <curlMaterial />
      </mesh>
    </>
  )
}
```

## Write the shader

We could use an inbuilt three.js material to color our lines, but to color the lines according to their z position (and therefore generate a better 3D effect) we'll need to write our own WebGL shader. I've used [shaderMaterial](https://github.com/pmndrs/drei#shadermaterial) from [@react-three/drei](https://github.com/pmndrs/drei) to extend three.js with my own material like so:

```js
import { shaderMaterial } from "@react-three/drei"
import { fragmentShader } from "./shaders/fragment"
import { vertexShader } from "./shaders/vertex"

const CurlMaterial = shaderMaterial(
  {
    /* uniforms go here */
  },
  vertexShader,
  fragmentShader
)

extend({ CurlMaterial }) // this means I can now use <curlMaterial> in my Line component
```

The vertex and fragment shader for this sketch are actually very simple. The vertex shader simply sets the inbuilt gl_Position variable and passes one varying variable to the fragment shader: vStrength, which is set to the z position of each vertex.

```js
export const vertexShader = `
    varying float vStrength; 

    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

        vStrength = position.z; 
    }
`
```

The fragment shader, which controls the color of each pixel, contains a function written by [Matt DesLauriers](https://www.mattdesl.com/) to create [HSL colors in GLSL](https://github.com/Jam3/glsl-hsl2rgb/blob/master/index.glsl).

This function is extremely useful because we can use the brightness to convey parts of the image which are closer or further away from the camera, enhancing the 3D effect of the model.

```js
import { hsl2rgb } from "./hsl2rgb"

export const fragmentShader = `
varying float vStrength; 

${hsl2rgb}

void main() {
    float strength = vStrength * 0.07 - 0.1; 
    vec3 color = hsl2rgb(0.8 + strength * 0.2, strength, strength);   

    gl_FragColor = vec4(color, 1.0);
}
`
```

Applying these shaders to our lines gives them a smooth depth effect, making the sketch appear three dimensional.

## Wrap up and further reading

The version of the sketch on this page has been enhanced a little using some additional uniforms in the fragment shader to control the animations and additional properties in the React component - though adding both of these is fairly trivial. The complete code is available in [this repo](https://github.com/OwnKng/scribbled-sketch).

There are many fantastic resources on WebGL that I've leveraged in developing this piece. I would highly recommend looking at the following:

- Ukrainian 🇺🇦 web developer and WebGL star [Yuri Artiukh's](https://twitter.com/akella?lang=en-GB) fantastic [YouTube live streams](https://www.youtube.com/user/flintyara) and [this video](https://www.youtube.com/watch?v=8PG4RrNwby0&ab_channel=YuriArtiukh) in particular.
- Creative developer [Bruno Imbrizi](https://www.brunoimbrizi.com/) wrote a very [detailed tutorial](https://tympanus.net/codrops/2019/01/17/interactive-particles-with-three-js/) on particle effects on [codrops](https://tympanus.net/codrops/).
- This [inspiring tutorial](https://tympanus.net/codrops/2021/08/31/surface-sampling-in-three-js/) by [Louis Hoebregts](https://www.mamboleoo.be/) on surface sampling for 3D models on [codrops](https://tympanus.net/codrops/).

[^1]: This code is based Bruno Imbrizi's code from [this](https://tympanus.net/codrops/2019/01/17/interactive-particles-with-three-js/) tutorial.
[^2]: The actual number of this threshold will differ depending on the image used.
