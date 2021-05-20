// called once paintings.json is loaded
const displayData = (d, dn) => {

    // get Night's Watch painting
    const nightsWatch = d[936]
  
    const nightsWatchSvg = d3.select( "div#nights-watch" ).select( "svg" )
      .attr( "viewBox", `0 0 ${nightsWatch.width} ${ nightsWatch.height }` )
      .attr( "preserveAspectRatio", "xMinYMin meet" ) 
  
    const nightsWatchImage = nightsWatchSvg.append( "image" )
      .attr( "xlink:href", nightsWatch.imageUrl )
      .attr( "width", nightsWatch.width )    
      .attr( "height", nightsWatch.height )  
      .attr( "transform", `translate(${ nightsWatch.width / 2 - 80 })`)
  
    const nWRects = nightsWatchSvg.append( "g" ).selectAll( "rect" )
      .data( nightsWatch.packed ).enter().append( "rect" )
      .attr( "x", r => r.x )
      .attr( "y", r => r.y )
      .attr( "width", r => r.w )
      .attr( "height", r => r.h )
      .attr( "fill", r => r.color )
  
    const nWG = nightsWatchSvg.select( "g" )
      .attr( "transform", `translate(${ nightsWatch.width / 2 - 80 })`)
      .attr( "width", nightsWatch.width )    
      .attr( "height", nightsWatch.height - 100 )  
      .attr( "display", "none" )  
  
    nightsWatchImage.on( "mouseover", () => nWG.attr( "display", null )  )
  
    nWG.on( "mouseout", () => nWG.attr( "display", "none" ) )
  
    const vanGogh = d[3015]
  
    const vanGoghSvg = d3.select( "div#van-gogh" ).select( "svg" )
      .attr( "viewBox", `0 0 ${ vanGogh.width } ${ vanGogh.height }` )
      .attr( "preserveAspectRatio", "xMinYMin meet" ) 
  
    const vanGoghImage = vanGoghSvg.append( "image" )
      .attr( "xlink:href", vanGogh.imageUrl )
      .attr( "width", vanGogh.width )    
      .attr( "height", vanGogh.height )  
      .attr( "transform", `translate(${ vanGogh.width / 5 })`)
  
    const vgRects = vanGoghSvg.append( "g" ).selectAll( "rect" )
      .data( vanGogh.packed ).enter().append( "rect" )
      .attr( "x", r => r.x )
      .attr( "y", r => r.y )
      .attr( "width", r => r.w )
      .attr( "height", r => r.h )
      .attr( "fill", r => r.color )
  
    const vgG = vanGoghSvg.select( "g" )
      .attr( "transform", `translate(${ vanGogh.width / 5 })`)
      .attr( "width", vanGogh.width )    
      .attr( "height", vanGogh.height - 100 )  
      .attr( "display", "none" )  
  
    vanGoghImage.on( "mouseover", () => vgG.attr( "display", null )  )
  
    vgG.on( "mouseout", () => vgG.attr( "display", "none" ) )
  
  
    // get all data for specified key
    const get = key => 
      _.map( d, painting => painting[key])
  
    // get counts for key, specify "desc" or "asc"
    const getCount = (key, whichWay) => 
      _.orderBy( _.map( _.countBy( get( key ) ), ( v, k ) => [ v, k ] ) , a => a[0], [whichWay] )
  
    // get all paintings by artist
    const getPaintingsByArtist = artist => _.filter( d, p => _.includes( p.artist, artist ) )  
  
    // chose subset of data to use and specify div container that will make the svg
    const displayAsGrid = ( paintingsToUse, divID ) => {
      // create svg where data will be generated
      const svg = d3.select( `div#container-${divID}` )
        .append( "svg" )
        .attr( "preserveAspectRatio", "xMinYMin meet" )
        .attr( "viewBox", `0 0 200 200` )
        .classed( "svg-content", true )
  
      // create a group for each painting
      const paintings = svg.selectAll( "g" )
        .data( paintingsToUse ).enter().append( "g" )
        .attr( "transform", ( d, i ) => 
          `translate(${ i % 4 * 100 + 2.5 },
          ${ Math.floor( i / 4 ) * 100 + 2.5 })
          scale(${ 95 / d.width }, ${ 95 / d.height })` )
        .style('cursor', 'pointer')
  
      paintings.on( "click", (d, i) => 
        i.imageUrl ? window.open(i.imageUrl, '_blank') : "" )
  
      // assemble the painting with rectangles in each group
      const painting = paintings.selectAll( "rect" )
        .data( p => p.packed ).enter().append( "rect" )
        .attr( "x", r => r.x )
        .attr( "y", r => r.y )
        .attr( "width", r => r.w )
        .attr( "height", r => r.h )
        .attr( "fill", r => r.color )
  
      return { "svg": svg, "paintings": paintings }
    }
  
    const rembrandt =  getPaintingsByArtist( "Rembrandt" )
    const rembrandtDisplay = displayAsGrid( _.slice( rembrandt, 0, 8 ), "rembrandt" )
  
    const modern = _.slice( _.filter( d, p => p.date > 1910 ), 8, 16 )
    const modernDisplay = displayAsGrid( modern, "2" )
  
    const colorData = ( whichColor, duplicateYears ) => {
      // get time and hsl (hue, saturation, lightness)
      let hslAndTime = _.flatten( _.map( whichColor, p => 
        _.map( p.packed, c => {
          // convert hex into hsl
          let hsl = d3.hsl( c.color )
          return { 
            "date": p.date,
            "h": hsl.h,
            "s": hsl.s,
            "l": hsl.l
          } 
        } ) ) )
  
      // filter for any potential null values
      hslAndTime = _.filter( hslAndTime, c => 
        !isNaN( c.date ) && c.h >= 0 && c.h <= 360 && !isNaN( c.s ) && !isNaN( c.l ) )
  
      // Since I've decided to graph hue, I'm going to filter for higher saturation of 50% or above
      hslAndTime = _.filter( hslAndTime, c =>
        c.s > 0.2 ) 
  
      // group objects by their date
      let noDateDuplicatesHslAndTime = _.groupBy( hslAndTime, "date" )
  
      // take one sample per date
      noDateDuplicatesHslAndTime = _.map( noDateDuplicatesHslAndTime, c => _.sample( c ) )
  
      return duplicateYears ? hslAndTime : noDateDuplicatesHslAndTime
  
    }
  
    // takes in data containing hue, saturation and lightness
    // specify the svg to use by supplying ID
    // graphWhat should either be "hue" or "lightness"
    const displayColorGraph = ( hslTime, svgID, graphWhat ) => {
  
      // width and heigh of graph
      const width = 1000
      const height = 360
  
      const scaleDate = d3.scaleTime()
        .domain( d3.extent( get( "date" ), date => { return new Date( date, 0 ) } ) )
        .range( [0, width] )
  
      
  
      // domain of hue uses degrees from a color wheel
      const scaleHue = d3.scaleLinear()
               .domain( [0, 360] )
               .range( [height, 0] )
  
      // lightness is described by a value between 0 and 1, 0 Black -> 1 White
      const scaleLight = d3.scaleLinear()
                 .domain( [0, 1] )  
                 .range( [height, 0] )
  
      // create svg canvas
      const svg = d3.select( `svg#${svgID}` )
        .attr( "preserveAspectRatio", "xMinYMin meet" )
        .attr( "viewBox", `0 0 ${ width + 300 } ${ height }` )
        .classed( "svg-content", true )
  
      // create axes
      const xAxis = svg.select( "g.x-axis" )
        .style("font-size", "20px")
        .call( d3.axisBottom( scaleDate ).tickFormat( d3.timeFormat( "%Y" ) )
          .ticks( d3.timeYear.every(50) ) )
        .attr( "transform", `translate(150, ${height})` )
        .selectAll( "text" )
          .attr( "transform", "translate(-20, 30)rotate(-65)" )
  
      const yAxis = svg.select( "g.y-axis" )
        .call( d3.axisLeft( graphWhat == "hue"
                              ? scaleHue
                              : graphWhat == "lightness"
                                ? scaleLight
                                : 0 ).ticks(0) )
        .attr( "transform", `translate(150, 0)` )
        
      yAxis.append( "text" )
        .attr( "x", 0 )
        .attr( "y", 50 )
        .attr( "fill", "currentColor" )
        .attr( "text-anchor", "start" )
        .attr( "transform", "translate(-120, 362)rotate(270)" )
        .style("font-size", "21px")
        .attr( "font-weight", "bold" )
        .text( "Hue in Degrees Around Color Wheel" )
  
      yAxis.selectAll( "rect" )
        .data( _.range( 0, 360 ) ).enter().append( "rect" )
        .attr( "fill", h => `hsl(${h},80%,50%)` )
        .attr( "x", -60 )
        .attr( "y", ( h, i ) => h )
        .attr( "width", 40 )
        .attr( "height", height/360 )
        .attr( "transform", "scale(-1)translate(70,-360)" )   
  
      yAxis.append("text")
        .attr( "x", 280 )
        .attr( "y", 470 )
        .attr( "fill", "currentColor" )
        .attr( "text-anchor", "start" )
        .style( "font-size", "28px" ) 
        .attr( "font-weight", "bold" )
        .text( "Sorting Date of Painting" )
  
  
      // plot data
      const marks = svg.select( "g.marks" )
        .selectAll( "circle.point" ).data( hslTime ).enter().append( "circle" )
        .attr( "class", "point" )
        .attr( "transform", `translate(150, 0)` )
        .attr( "fill" , p => 
          `hsl(${ p.h },${ _.round( p.s * 100 ) }%,${ _.round( p.l * 100 ) }%)` )
        .attr( "r", 5 )
        .attr( "cx", p => { return scaleDate( new Date( p.date, 0 ) ) } )
        .attr( "cy", p => 
          graphWhat == "hue"
            ? scaleHue( p.h )
            : graphWhat == "lightness"
              ? scaleLight( p.s )
              : 0 )
    }
  
    // display graphed hue
    displayColorGraph( colorData( dn, false ), "color-graph-normalized", "hue" )
    // display new sample of graphed hue every second
    setInterval( () => {
      d3.select( "g.marks" ).selectAll( "circle.point" ).remove()
      d3.select( "g.y-axis" ).selectAll( "text" ).remove()
      displayColorGraph( colorData( dn, false ), "color-graph-normalized", "hue" ) 
    }, 1000)
  
    // function to bin years by specified years
    const binYears = ( from, to ) => {
      let byYears = _.groupBy( colorData( d, true ), c => c.date )
      return _.flatten( 
        _.filter( byYears, ( v, k ) =>
          +k >= (100*from) && +k <= (100*to) ) )
    }
  
    const centuries = [[13.5,14],[14,14.5],[14.5,15],[15,15.5],[15.5,16],[16,16.5],[16.5,17],[17,17.5],[17.5,18],[18,18.5],[18.5,19],[19,19.5],[19.5,20]]
  
    const yearsBinned = _.map( centuries, c => binYears( c[0], c[1] ) )
  
    const totalAmountInEachCentury = _.map( yearsBinned, y => y.length )
  
    // get total amount of bluer colors
    const totalAmountOfCool = _.map( _.map( yearsBinned, y => _.filter( y, c => c.h > 50 ) ), b => b.length )
  
    // computer percentage of blueish colors
    percentageOfBlue = _.map( _.range(0, totalAmountOfCool.length ), i => totalAmountOfCool[i] / totalAmountInEachCentury[i] )
  
    const displayColorRatioGraph = ( ratio, svgID ) => {
  
    // width and heigh of graph
    const width = 400
    const height = 360
  
    const scaleDate = d3.scaleTime()
      .domain( d3.extent( get( "date" ), date => { return new Date( date, 0 ) } ) )
      .range( [0, width] )
  
    // domain of hue uses degrees from a color wheel
    const scaleRatio = d3.scaleLinear()
              .domain( [0, 1] )
              .range( [0, height] )
  
    const rscaleRatio = d3.scaleLinear()
              .domain( [1, 0] )
              .range( [0, height] )
  
    // create svg canvas
    const svg = d3.select( `svg#${svgID}` )
      .attr( "preserveAspectRatio", "xMinYMin meet" )
      .attr( "viewBox", `0 0 ${ width + 100 } ${ height + 200 }` )
      .classed( "svg-content", true )
  
    // create axes
    const xAxis = svg.select( "g.x-axis" )
      .style("font-size", "20px")
      .call( d3.axisBottom( scaleDate ).tickFormat( d3.timeFormat( "%Y" ) )
        .ticks( d3.timeYear.every(50) ) )
      .attr( "transform", `translate(150, ${height+20})` )
      .selectAll( "text" )
        .attr( "transform", "translate(-20, 30)rotate(-65)" )
  
    const yAxis = svg.select( "g.y-axis" )
      .call( d3.axisLeft( rscaleRatio ).ticks(10) )
      .attr( "transform", `translate(150, 20)` )
      
    yAxis.append( "text" )
        .attr( "x", -300 )
        .attr( "y", 30 )
        .attr( "fill", "currentColor" )
        .attr( "text-anchor", "start" )
        .attr( "transform", "translate(-80, 65)rotate(270)" )
        .style("font-size", "20px")
        .attr( "font-weight", "bold" )
        .text( "Percentage of Hue above 50deg" )
  
    yAxis.append("text")
      .attr( "x", -10 )
      .attr( "y", 460 )
      .attr( "fill", "currentColor" )
      .attr( "text-anchor", "start" )
      .style( "font-size", "20px" ) 
      .attr( "font-weight", "bold" )
      .text( "Sorting Date of Paintings by Half-Centuries" )
  
    // plot data
    const marks = svg.select( "g.marks" )
      .selectAll( "rect" ).data( ratio ).enter().append( "rect" )
      .attr( "class", "point" )
      .attr( "transform", `translate(142, 480)scale(1,-1)` )
      .attr( "fill" , "cyan" )
      .attr( "x", ( r, i ) => i * ( width / 13.2 ) + 14 )
      .attr( "y", r => 100 )
      .attr( "width", width / 13.2)
      .attr( "height", r => scaleRatio( r ))
  
      console.log(ratio)
    }
  
    displayColorRatioGraph( percentageOfBlue, "color-graph-ratio" )
  
    const displayEntireGrid = ( allPaintings ) => {
  
      // create svg where data will be generated
      const svg = d3.select( `div#all-paintings` )
        .append( "svg" )
        .attr( "preserveAspectRatio", "xMinYMin meet" )
        .attr( "viewBox", `0 0 1600 400` )
        .classed( "svg-content", true )
  
      // create a group for each painting
      const paintings = svg.selectAll( "g" )
        .data( allPaintings ).enter().append( "g" )
        .attr( "transform", ( d, i ) => 
          `translate(${ i % 16 * 100 + 2.5 },
          ${ Math.floor( i / 16 ) * 100 + 2.5 })
          scale(${ 95 / d.width }, ${ 95 / d.height })` )
        .style('cursor', 'pointer')
    
      paintings.on( "click", (d, i) => 
        d.imageUrl ? window.open(d.imageUrl, '_blank') : "" )
  
      // assemble the painting with rectangles in each group
      const painting = paintings.selectAll( "rect" )
        .data( p => p.packed ).enter().append( "rect" )
        .attr( "transform-origin", "center" )
        .attr( "x", r => r.x )
        .attr( "y", r => r.y )
        .attr( "width", r => r.w )
        .attr( "height", r => r.h )
        .attr( "fill", r => r.color )
  
      return { "svg": svg, "paintings": paintings }
    }
  
    displayEntireGrid( d )
    
  }
  
  Promise.all(
    [ d3.json( "data/paintings.json" ),
      d3.json( "data/normalizedPaintings.json" ) ] )
    .then( paintingData => displayData( paintingData[0], paintingData[1] ) ) 