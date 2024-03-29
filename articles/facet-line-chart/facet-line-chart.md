---
url: facet-line-chart
title: Faceting charts with visx and CSS grid
published: 2021-01-04
description: How to create faceted line charts
editLink: https://github.com/OwnKng/ownkng.dev-content/blob/main/articles/facet-line-chart/facet-line-chart.md
tags:
  - Data viz
img: https://res.cloudinary.com/dqrv3tasx/image/upload/v1679514691/lineChart_bhxy5f.png
---

<iframe src='https://components.ownkng.dev/facet'></iframe>

[Visx](https://airbnb.io/visx/) is a collection of visualisation packages for React developed by Airbnb. The power of visx is that it combines low-level primitives for constructing data visulisations out of basic geometries and scales, while also providing high-level components and functions to handle the more finicky elements of creating graphs for the web - such as tooltips, legends or resizing. This makes visx a highly expressive library for data visualisation, while also conforming with the declarative syntax of React.

I've written a more extensive [introduction to visx](https://ownkng.vercel.app/thoughts/data-viz-react). This post is to intended to instead demonstrate how to create a visualisation feature I use extensively when working with R and [ggplot](https://ggplot2.tidyverse.org/index.html): facets.

A faceted visualisation (also known as [small multiple charts](https://en.wikipedia.org/wiki/Small_multiple)) is composed of a matrix of plot panels where each plot shares the same x and y variables. Each panel represents another variable that the observations share.

In the example above, time is represented on the x axis; GDP per capita ($) is represented on the y axis. Each facet represents a country. This is an alternative to a line graph in which we encode country using different colors and plot onto a single panel, which with ten countries would be difficult to do effectively.

Another advantage we have when using facets is that we can meaningfully order them. Here, our facets are ordered by GDP per capita in 2019. This makes it easy to discern that India is the poorest country in our sample, and that Japan has a higher GDP per capita than South Korea.

# Creating a faceted visualisation with visx

The finished visualisation we're going to create, the code and data are all available [here](https://codesandbox.io/s/upbeat-sun-kzolv?file=/src/Line.js). The data comes from the [World Bank Open Data](https://data.worldbank.org/) portal.

We'll need to install the visx packages for this project. Airbnb have provided visx as several standalone packages, but as we'll be using many of them in this project the easiest way to install them is by running the following command.

```bash
npm i @visx/visx
```

We're also going to be using some functions from the [D3](https://d3js.org/) library, so we'll need to install D3 too.

```bash
npm i d3
```

## Creating our lines

When developing a visualisation with visx, I've found it helpful to divide the process into four fundamental stages that we repeat for all our projects. These are:

- Set the chart dimensions
- Create accessor functions to select our data
- Create scales to translate our data into coordinates
- Return the visualisation

After we've done these tasks, we can then work on any elements that are more specific to a particular visualisation, like interactions or specific layouts.

### Set the chart dimensions

Let's create a new [function component](https://reactjs.org/docs/components-and-props.html) in our React application. This function component will take several props - data, width, height and margin (which we'll provide with some sensible default values). Add the following code in a new file called `Line.js`.

```jsx
import React from "react"

const Line = ({
  data,
  width,
  height,
  margin = { top: 40, left: 10, right: 15, bottom: 25 },
}) => {
  // Set dimensions
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  // Create accessor functions

  // Create scales

  // Return our chart
  return <svg width={width} height={height}></svg>
}

export default Line
```

### Create accessor functions to select our data

Our visualisations are going have year on the x axis and GDP per capita on the y axis. Let's create some accessor functions to make selecting these values easier.

```jsx
// create accessor functions
const xAccessor = (d) => d.year;
const yAccessor = (d) => d.gdpPerCap;
...
```

### Create scales to translate our data into coordinates

We'll need to convert our year and GDP per capita values to units of pixels that fit inside our `<svg>` element. We'll do this with the `scaleLinear()` function from `@visx/scale`

Import the `scaleLinear()` function into our _Line.js_ file.

```jsx
import { scaleLinear } from "@visx/scale"
```

We can then use this function to create our scales. Note that we've provided fixed values to the `domain` argument, rather than mapping them to the minimum and maximum of the values. This is because we want all our lines to share the same scales to make comparisons across the charts simpler.

```jsx
// Create scales
const xScale = scaleLinear({
  range: [margin.left, innerWidth + margin.left],
  domain: [1960, 2019],
  nice: true,
})

const yScale = scaleLinear({
  range: [innerHeight + margin.top, margin.top],
  domain: [0, 70000],
  nice: true,
})
```

### Return the visualisation

With our accessor functions and scales created, we can now return the visalisation from our `<Line />` component.

Import the geometry primitives into our _Line.js_ file, as well as the curve type we're going to use in the visulisation.

```jsx
import { LinePath, AreaClosed } from "@visx/shape"
import { curveLinear } from "@visx/curve"
```

We can now use these geometries inside our return statement, providing them with the scales and accessors we've defined.

```jsx
...
// Return our chart
return (
  <svg width={width} height={height}>
    <AreaClosed
      data={data}
      x={(d) => xScale(xAccessor(d))}
      y={(d) => yScale(yAccessor(d))}
      yScale={yScale}
      curve={curveLinear}
      fill='#ffcb8f'
    />
    <LinePath
      data={data}
      x={(d) => xScale(xAccessor(d))}
      y={(d) => yScale(yAccessor(d))}
      curve={curveLinear}
      stroke='black'
    />
  </svg>
);
```

## Setting up our facets

We'll create another function component to house our facets. This component will supply our data to the `<Line />` component.

Create a new file called `FacetLineChart.js` and add the following code.

```jsx
import React from "react"
import Line from "./Line"
import { group } from "d3"
import { gdpPerCapData } from "./data"

const FacetLineChart = () => {
  const data = gdpPerCapData

  const dataGrouped = Array.from(
    group(data, (d) => d.country),
    ([key, value]) => ({ key, value })
  )

  return (
    <>
      {dataGrouped.map((data, i) => (
        <Line key={i} data={data.value} width={800} height={400} />
      ))}
    </>
  )
}

export default FacetLineChart
```

The above code makes use of the [`group()` function](https://observablehq.com/@d3/d3-group) from D3. The `group()` function takes an array and a key, and returns a [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) from the key to the array values.

By wrapping this in `Array.from()`, we've constructed a nested array in which each element represents a country. Inside each element is another array with all the values for that country. This allows us to map through the array, and supply the values individually as the `data` prop to our `<Line />` component.

However, if we run this code, we'll see that our lines are stacked on top of each other, rather than paginated in panels. To construct our facets, we're going to add a wrapper and apply some CSS.

```jsx
  return (
    <>
      <div className="grid">
        {dataGrouped.map((data, i) => (
          <Line key={i} data={data.value} width={800} height={400} />
        ))}
      </div>
    </>
```

Add the following CSS in our _styles.css_ file.[^1]

```CSS
.grid {
  display: grid;
  height: 600px;
  width: 100%;
  row-gap: 10px;

  grid-template-columns: repeat(5, minmax(100px, 1fr));
  grid-template-rows: repeat(2, minmax(100px, 1fr));
}

.grid > div {
  position: relative;
}

@media only screen and (max-width: 600px) {
  .grid {
    grid-template-columns: repeat(2, minmax(100px, 1fr));
    grid-template-rows: repeat(5, minmax(100px, 1fr));
    height: 800px;
  }
}
```

This CSS arranges each plot in a grid. The width of the grid will fill 100% of its parent container, but the height will change between 600px and 800px depending on the screen size. Our media query will also rearrange our grid for smaller screens so that on a mobile device the grid is arranged vertically, rather than horizontally.

We'll now want to make our individual lines responsive so that they fill the dimensions of our grid cells. In our _FacetLineChart.js_ file, import the `<ParentSize />` component from `@visx/responsive` library.

```jsx
import ParentSize from "@visx/responsive/lib/components/ParentSize"
```

Then amend the return statement to use the the `<ParentSize />` component, which supplies the width and height props to our `<Line />` component.

```jsx
return (
  <>
    <div className='grid'>
      {dataGrouped.map((data, i) => (
        <ParentSize key={i}>
          {({ width, height }) => (
            <Line data={data.value} width={width} height={height} />
          )}
        </ParentSize>
      ))}
    </div>
  </>
)
```

## Improving our line charts

Now we have our facets set up, we'll add axes to the visualisations and a facet label to each chart to show which country the data is showing. We'll also reorder our visualisations from richest country to poorest.

### Adding axes

Adding axes to our chart is extremely simple using the `@visx/axis` package. We're also going to nicely format our axes text with the [`format()` function](https://observablehq.com/@d3/d3-format) from D3.

Add the following imports to the _Line.js_ file.

```jsx
import { AxisLeft, AxisBottom } from "@visx/axis"
import { format } from "d3"
```

We'll then modify our return statement to include our axes.

```jsx
  return (
    <svg width={width} height={height}>
      ...
      <AxisBottom
        scale={xScale}
        top={innerHeight + margin.top}
        tickFormat={format("d")}
        numTicks={4}
      />
      <AxisLeft
        scale={yScale}
        left={margin.left}
        tickFormat={format("~s")}
        numTicks={8}
      />
      ...
  )
```

### Adding facet labels

When we created `dataGrouped` array, we used the country name as the key for each group. We can provide this key as an additional prop to our `<Line />` component.

```jsx
return (
  ...
  {dataGrouped.map((data, i) => (
  <ParentSize key={i}>
    {({ width, height }) => (
      <Line dataKey={data.key} data={data.value} width={width} height={height} />
    )}
  </ParentSize>
  ))}
  ...
)
```

We'll then destructure this prop in our `<Line />` component.

```jsx
const Line = ({
  dataKey,
  data,
  width,
  height,
  margin = { top: 40, left: 40, right: 15, bottom: 25 }
}) => {
  ...
}
```

To add the `dataKey` to our line charts, we'll use the `<Text />` component from the `@visx/text` library. Add the following code to our _Line.js_ file.

```jsx
import { Text } from "@visx/text";
...

  return (
    <svg width={width} height={height}>
      <Text
        x={width / 2}
        width={width}
        textAnchor="middle"
        y={margin.top / 2}
        fontSize={14}
      >
        {dataKey}
      </Text>
      ...
  )
```

### Reordering our facets

At the moment, our facets are not in any particular order. To aid interpretation, we want our charts to be ordered from the highest GDP per capita to the lowest.

We can do this by creating a new array for country names - ordered by GDP per capita - and then using this in a `sort()` method on our original data array.

```jsx
const FacetLineChart = () => {
  let data = gdpPerCapData;

  // Create a new array of country names from richest to poorest
  const order = data
    .filter((row) => row.year === 2019)
    .sort((a, b) => a.gdpPerCap - b.gdpPerCap)
    .map((row) => row.country);

  // Sort our data array using our ordered country names
  data = data.sort(
    (a, b) => order.indexOf(b.country) - order.indexOf(a.country)
  );

  ...
}
```

### Adding a tooltip

Lastly, it's helpful to add a tooltip to each of our charts to show the GDP per capita figure when we hover over a particular location.

In our _Line.js_ file, add the following imports.

```jsx
import React, { useCallback } from "react"
import { format, min, max } from "d3"
import { useTooltip, TooltipWithBounds } from "@visx/tooltip"
import { localPoint } from "@visx/event"
```

We'll use the `useTooltip()` hook from `@visx/tooltip`, which provides several functions to position our tooltip and set the data to show.

```jsx
const {
  showTooltip,
  hideTooltip,
  tooltipData,
  tooltipLeft = 0,
  tooltipTop = 0,
} = useTooltip()
```

Let's write an event handler that will get the coordinates of our hover position and translate it into an x and y value to display in our tooltip.

```jsx
const handleTooltip = useCallback(
  (event) => {
    const { x } = localPoint(event) || { x: 0 };
    let x0 = xScale.invert(x);
    x0 = Math.round(x0);
    if (x0 > max(data, xAccessor)) x0 = max(data, xAccessor);
    if (x0 < min(data, xAccessor)) x0 = min(data, xAccessor);

    let d = data.filter((row) => row.year === x0);
    let yMax = max(d, yAccessor);

    showTooltip({
      tooltipData: d,
      tooltipLeft: xScale(x0),
      tooltipTop: yScale(yMax),
    });
  },
  [data, showTooltip, yScale, xScale]
);

return (
  ...
```

Note that the `if` statements are necessary here because our axes run to 2020 (where we currently have no data). We also don't have any data for Indonesia before 1967. The `if` statements handle this by returning the closest value to the missing year - so if we hover over 2020, our tooltip will stay at 2019 rather than showing an empty container.

In our return statement, we can now add a `<rect>` element which will register hovering or a touch event.

When tooltipData is not empty, we'll also add a `<circle>` to show the point that the user is hovering over.

```jsx
return (
  <svg width={width} height={height}>
  ...
  <rect
        x={margin.left}
        y={margin.top}
        width={innerWidth}
        height={innerHeight}
        fill="transparent"
        onTouchStart={handleTooltip}
        onTouchMove={handleTooltip}
        onMouseMove={handleTooltip}
        onMouseLeave={() => hideTooltip()}
      />
      {tooltipData &&
        tooltipData.map((row) => (
          <circle
            cx={xScale(xAccessor(row))}
            cy={yScale(yAccessor(row))}
            r={5}
            stroke="black"
            fill="#ffcb8f"
            strokeWidth={2}
            pointerEvents="none"
          />
        ))}
    </svg>
  );
)
```

Finally, we'll add our tooltip using the `<TooltipWithBounds />` component. Our tooltip only shows the GDP per capita value, but could easily be expanded to show additional data.

Note that our tooltip goes outside our closing `<svg>` tag, and so we need to wrap our whole return statement in a React fragment.

```jsx
return (
  <>
    <svg width={width} height={height}>
      ...
    </svg>
    {tooltipData && (
      <TooltipWithBounds
        key={Math.random()}
        top={tooltipTop - 12}
        left={tooltipLeft + 12}
      >
        {tooltipData.map((row) => format("$.2~s")(yAccessor(row)))}
      </TooltipWithBounds>
    )}
  </>
)
```

And that's it. The completed code for our faceted visualisation is available [here](https://codesandbox.io/s/upbeat-sun-kzolv?file=/src/Line.js).

[^1]: Or wherever styles are housed in your application. Because visx isn't opinionated about styling, it works well with [Styled Components](https://styled-components.com/), which is my preferred CSS in JavaScript library.
