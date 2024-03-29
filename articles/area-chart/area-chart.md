---
url: area-chart
title: Animating data visualisations in React
published: 2021-01-06
description: Animated visualisations with visx and Framer Motion
img: https://res.cloudinary.com/dqrv3tasx/image/upload/v1679514468/area-chart_qir57y.png
editLink: https://github.com/OwnKng/ownkng.dev-content/blob/main/articles/area-chart/area-chart.md
tags:
  - Data viz
---

<iframe src='https://components.ownkng.dev/area'></iframe>

[Visx](https://airbnb.io/visx/) is a collection of visualisation packages for React developed by Airbnb. The power of visx is that it combines low-level primitives for constructing data visualisation out of basic geometries and scales, while also providing high-level components and functions to handle the more finicky elements of creating graphs for the web - such as tooltips, legends and resizing. This makes visx a highly expressive library for data visualisation, while also conforming with the declarative syntax of React.

I've written a more [extensive introduction to visx](https://ownkng.vercel.app/thoughts/data-viz-react), as well as a post showing how to [create faceted charts with the library](https://ownkng.vercel.app/thoughts/facet-line-chart). This is a shorter post focused on animating visualisations.

In contrast to most other visualisation libraries, Visx is largely un-opinionated on animation. While there is a visx package, [@visx/react-spring](https://airbnb.io/visx/docs/react-spring), that provides animated components, developers are free to bring their own animation library.

As its name suggests @visx/react-spring uses popular React library [react-spring](https://www.react-spring.io/) to handle animations. I've used react-spring on a few projects in the past, but recently I've been using [Framer Motion](https://www.framer.com/api/motion) more as I find its syntax easier to navigate.

With Framer Motion, it's possible to animate any HTML or SVG element by simply adding `motion` to the tag, like so

```jsx
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
  Fade in
</motion.div>
```

We can add the apply the same technique to our visx visualisations. For instance, stacked area charts can be constructed with visx using the `<AreaStack />` component, which we can provide with children to define our own render functions using SVG `<path>` elements. This would typically look something like the following:

```jsx
const MyAreaChart = ({ data, height, width, margin }) => {
  // chart dimensions, accessors, scales, etc.

  return (
    <svg width={width} height={height}>
      <AreaStack
        top={margin.top}
        left={margin.left}
        data={data}
        keys={keys}
        x={(d) => xScale(x(d.data))}
        y0={(d) => yScale(y0(d))}
        y1={(d) => yScale(y1(d))}
      >
        {({ stacks, path }) =>
          stacks.map((stack) => (
            <path
              d={path(stack)}
              key={`stack-${stack.key}`}
              stroke='black'
              strokeWidth={0.5}
              fill={colorScale(stack.key)}
            />
          ))
        }
      </AreaStack>
    </svg>
  )
}
```

To animate this using Framer Motion, all we need to do is to swap the `<path>` element with a `<motion.path>`, and then provide the initial and animate props.

```jsx
...
  {({ stacks, path }) =>
    stacks.map((stack) => (
      <motion.path
        initial={false}
        animate={{ d: path(stack) }}
        key={`stack-${stack.key}`}
        stroke='black'
        strokeWidth={0.5}
        fill={colorScale(stack.key)}
      />
    ))
  }
...
```

The result of this is that when our visualisation updates with new data, our areas will smoothly animate from their original coordinates to their new ones.

You can this in action, along with the code, [here](https://codesandbox.io/s/nervous-sun-0n7cr?file=/src/App.js).
