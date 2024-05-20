/* CONSTANTS AND GLOBALS */
const width = window.innerWidth * 0.8;
      margin = 70,
      barHeight = 50;

let height = 0;
let svg, xScale, yScale, colorScale, xAxis, yAxis, gx;

/* STATE */
let state = {
  data: [],
  stackData: [],
  normalizedData: [],
  selected: "count"
}

let countries, years = [];

/**
  Transition
*/
  const changeGraph = (e) =>{
    console.log("transition button clicked!", e.target.id)
    let button = e.target.id;
    let data = button === "button1" ? stackData : stackedDataNormal;
    xScale = d3.scaleLinear()
      .domain([0,  d3.max(data, d => d3.max(d, d => d[1]))])
      .range([margin, width - margin])

    drawStackedBarGraph(stackChart, data, xScale)
      
  }
  
/* LOAD DATA */
d3.csv('../data/MoMA-yearly-sample.csv', d3.autoType)
  .then(raw_data => {
    state.data = raw_data;
    
    // List of country: remove year column which is 0 index
    countries = state.data.columns.slice(1)
    // List of years: map the value of the first column called Year for X axis
    years = state.data.map(d => (d.Year))
    
    /** stacked data */
    state.stackData = d3.stack()
      .keys(countries)
      .order(d3.stackOrderDescending)
      (state.data)

    state.normalizedData = d3.stack()
      .keys(countries)
      .order(d3.stackOrderDescending)
      .offset(d3.stackOffsetExpand)
      (state.data)
    
      console.log("load data",state)
      init();
    });

/* INITIALIZE */
const init = () => {
  // Compute the height from the number of stacks.
  height = state.stackData.length * barHeight + margin*2;
  
  // + SCALES 
    // x scale - count of works 
  xScale = d3.scaleLinear()
    .domain([0,  d3.max(state.stackData, d => d3.max(d, d =>{ 
      return d[1]}))])
    .range([margin, width - margin])
  
    // y scale - years 
  yScale = d3.scaleBand()
    .domain(years)
    .range([height - margin, margin/3])
    .paddingInner(0.2)
    .paddingOuter(0.3)
  
  colorScale = d3.scaleOrdinal(d3.schemePaired)
    .domain(countries)
  
  // + AXIS
  xAxis = d3.axisBottom(xScale)
  yAxis = d3.axisLeft(yScale)
  
  // + UI  ELEMENT
  const dropdown = d3.select("#dropdown")

  const options = dropdown
      .selectAll("option")
      .data(["count", "percentage"])
      .join("option")
      .text(d => d)
      .attr("value", d => d)
  
  dropdown
      .on("change", (e) => {
        state.selected = e.target.value
        
        draw();
      })

  const yearList = d3.select("#list")
      .selectAll("li")
      .data(years)
      .join("li")
      .attr("value", d => d)
      .html(d => `<a>${d}</a>`)
  
  // + CREATE SVG ELEMENT
  svg = d3.select("#container")
      .append("svg")
      .attr("class", "barGraph")
      .attr("width", width)
      .attr("height", height)
      .style("overflow", "visible");
      
  // + CALL AXES
  drawAxis(svg, xAxis, yAxis);
  draw();
}

/* DRAW */
const draw = () => {
  
  // change data by selected dropdown value
  const data = state.selected === "count" ? state.stackData : state.normalizedData;
  //update xScale
  xScale = d3.scaleLinear()
          .domain([0,  d3.max(data, d => d3.max(d, d => d[1]))])
          .range([margin, width - margin])
  xAxis = state.selected === "count" ? d3.axisBottom(xScale):d3.axisBottom(xScale).ticks(width/50, "%")

  //transition() returns transition, read more here(https://observablehq.com/@d3/selection-join)
  const t = svg.transition()
        .duration(1000);

  //update barGroup
  const barGroup = svg
      .selectAll(".barGroup")
      .data(d => {
        //console.log("state", state.stackData); 
        return data})
      .join("g")
        .attr("class", "barGroup")
        .attr("fill", d => colorScale(d.key))
        .attr("stroke", "grey")
        .selectAll("rect")
        // enter a second time = loop subgroup per subgroup to add all rectangles
        .data(d => {
          return d})
        .join(
          enter => enter.append("rect")
            .attr("x", margin)
            .attr("width", 0)
            .call(sel => sel.transition(t)
              .attr("x", d => xScale(d[0]))
              .attr("width", d => xScale(d[1]) - xScale(d[0])))
            ,
          update => update
            .call(sel => sel.transition(t)
              .attr("x", d => xScale(d[0]))
              .attr("width", d => xScale(d[1]) - xScale(d[0]))
            ),
          exit => exit.remove()
        )  
          .attr("y", d => yScale(d.data.Year))
          .attr("class", "bar")     
          .attr("height", yScale.bandwidth())
          .on("mouseover", mouseover)
          .on("mousemove", mousemove)
          .on("mouseleave", mouseleave)
  
  gx.transition(t)
    .call(xAxis)
    .selectAll(".tick")
    .delay((d, i) => i * 20);

}
const drawAxis = (svg, xAxis, yAxis) => {
      
  svg.append("g")
    .attr("transform", `translate(${margin}, 0)`)
    .call(yAxis)

  gx = svg.append("g")
    .attr("transform", `translate(0, ${height - margin})`)
    .call(xAxis)
}
/** Tooltip */
const tooltip = d3.select("#container")
  .append("div")
  .style("opacity", 0)
  .attr("class", "tooltip")
  .style("background-color", "white")
  .style("border", "solid")
  .style("border-width", "1px")
  .style("border-radius", "5px")
  .style("padding", "10px")

// Three function that change the tooltip when user hover / move / leave a cell
const mouseover = function(event, d) {
  const country = d3.select(this.parentNode).datum().key;
  const count = d.data[country];
  tooltip
      .html("Country: " + country + "<br>" + "Number of works: " + count)
      .style("opacity", 1)

}
const mousemove = function(event, d) {
  tooltip.style("transform","translateY(-55%)")
        .style("left",(event.x)/2+"px")
        .style("top",(event.y)/2-30+"px")
}
const mouseleave = function(event, d) {
  tooltip
    .style("opacity", 0)
}