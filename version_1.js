/* CONSTANTS AND GLOBALS */
const width = window.innerWidth * 0.8;
      margin = 70,
      barHeight = 50;

let height = 0;
let svg, xScale, yScale, colorScale, xAxis, yAxis, gx, gy;

/* STATE */
let state = {
  data: [],
  filteredData: [],
  stackData: [],
  normalizedData: [],
  graphType: "count",
  year: "1930s",
  departments:[]
}

let years, departments, continents, genders, filteredData = [];

  
/* LOAD DATA */
d3.csv('data/MoMA-continent-gender.csv', d3.autoType)
  .then(raw_data => {
    state.data = raw_data;
    
    // List of continents: 
    // filter column continent name columns which range from 2 - 8 index
    continents = state.data.columns.slice(2,9)

    // List of genders: 
    // filter gender name columns which range from 9
    genders = state.data.columns.slice(9)

    // List of years & departments: 
    // map the value of the first & second column called Year & Department for Y axis and filtering
    departments = [...new Set(state.data.map(d => (d.Department)))]
    years = [...new Set(state.data.map(d => (d.Year)))]

    

    console.log(departments, years, continents, genders)

    setData();
    
    console.log("load data",state.data)
    init();
  });

const setData = (year, ) => {
  filteredData = state.data.filter(d => 
    d.Year === state.year
  )
  state.filteredData = filteredData

  state.departments = [...new Set(state.filteredData.map(d => (d.Department)))]
  
  /** stacked data */
  state.stackData = d3.stack()
    .keys(continents)
    .order(d3.stackOrderDescending)
    (state.filteredData)

  state.normalizedData = d3.stack()
    .keys(continents)
    .order(d3.stackOrderDescending)
    .offset(d3.stackOffsetExpand)
    (state.filteredData)

  console.log("data update : ",state.year, state.filteredData)
}
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
  
    // y scale - departments 
  yScale = d3.scaleBand()
    .domain(departments)
    .range([margin/3, height - margin])
    .paddingInner(0.2)
    .paddingOuter(0.3)
  
  colorScale = d3.scaleOrdinal(d3.schemeAccent)
    .domain(continents)
  
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
        state.graphType = e.target.value
        
        draw();
      })

  const yearList = d3.select("#list")
      .selectAll("li")
      .data(years)
      .join("li")
      .attr("value", d => d)
      .html(d => `${d}`)

  const yearButton = d3.selectAll("li")
    .on("click", (e) => {
      state.year = e.target.value+"s";
      console.log("year list clicked",e, state.year)
      draw();
    })
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
  setData();
  
  // change data by selected dropdown value
  const data = state.graphType === "count" ? state.stackData : state.normalizedData;
  //update xScale
  xScale = d3.scaleLinear()
          .domain([0,  d3.max(data, d => d3.max(d, d => d[1]))])
          .range([margin, width - margin])
  xAxis = state.graphType === "count" ? d3.axisBottom(xScale):d3.axisBottom(xScale).ticks(width/50, "%")
  
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
          .attr("y", d => yScale(d.data.Department))
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
      
  gy = svg.append("g")
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