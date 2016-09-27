 function getCurrentRotation(rotate_value) {

    var angle = 0;
    var arr = rotate_value.split("rotate(");
    var angle_str = arr[1].substr(0,arr[1].length-1);
    angle = parseFloat(angle_str)/180*Math.PI;
    return angle;
}

 function drawSunBurst(idName,chart_size){

    $(idName).html('');

    var width = chart_size,
        height = chart_size,
        radius = (Math.min(width, height) / 2) - 10;

    var formatNumber = d3.format(",d");

    var x = d3.scale.linear()
        .range([0, 2 * Math.PI]);

    var y = d3.scale.sqrt()
        .range([0, radius]);

    var color = d3.scale.category20c();

    var partition = d3.layout.partition()
        .value(function(d) { 
          return d.size; 
        });

    function isIn(n, e) {
        return n === e ? !0 : n.children ? n.children.some(function(n) {
            return isIn(n, e)
        }) : !1
    }

    var arc = d3.svg.arc()
        .startAngle(function(d) {
          return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
        })
        .endAngle(function(d) {
          return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); 
        })
        .innerRadius(function(d) {
          var innerDy = 0;
          for(innerIndex = 0; innerIndex < d.depth; innerIndex++){
            innerDy += entity_values[innerIndex]/100;
          }
          return Math.max(0, y(innerDy)); 
        })
        .outerRadius(function(d) { 
          var innerDy = 0;
          for(innerIndex = 0; innerIndex <= d.depth; innerIndex++){
            innerDy += entity_values[innerIndex]/100;
          }
          return Math.max(0, y(innerDy)); 
        });

    var svg = d3.select(idName).append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");

    d3.json("data/data.json", function(error, root) {
      if (error) throw error;

      svg.selectAll("path")
          .data(partition.nodes(root))
        .enter().append("path")
          .attr("d", arc)
          .style("fill", function(d) {
            var arc_color = d.color;
            if(!arc_color) arc_color = color((d.children ? d : d.parent).title);
            return arc_color;
          })
          .style("display",function(d){
            if(entity_shows[d.depth] > 0) return "block";
            return "none";
          })
          .on("click", click)
        .append("title")
          .text(function(d) { return d.title + ":" + formatNumber(d.value); });

      svg.selectAll("text")
          .data(partition.nodes(root))
            .enter().append("text")
            .attr("dx",function(d){
              if(d.title.length < 15) return 0;
              return "-1.2em";
            })
            .attr("dy", "-0.7em")
            .attr("transform", function(d) {
                if(d.x == 0 && d.y == 0){
                  return "translate("+0+","+0+") rotate("+0+")";
                }
                var angle = Math.min(2 * Math.PI, x(d.x + d.dx/2));
                var innerDy = 0;
                for(innerIndex = 0; innerIndex < d.depth; innerIndex++){
                  innerDy += entity_values[innerIndex]/100;
                }
                var r = Math.max(0, y(innerDy + entity_values[d.depth]/100/2));
                var xPos = r*Math.sin(angle);
                var yPos = -r*Math.cos(angle);
                var rotate_value = Math.round(angle/Math.PI * 180);
                return "translate("+xPos+","+yPos+") rotate("+rotate_value+")";

            })
            .attr("text-anchor", function(d){
              return "middle";
            })
            .attr("class","wrap")
            .style("fill","black")
            .style("font-size",function(d){
              var rate_size = entity_values[d.depth];
              if(rate_size > 20) rate_size = 20;
              if(d.x == 0  && d.y == 0) rate_size = 20;
              if(entity_values[d.depth] == 0) rate_size = 0;
              return chart_size/20*rate_size/100;
            })
            .style("display",function(d){
              if(entity_shows[d.depth] > 0) return "block";
              return "none";
            })
            .text(function(d){return d.title;})
            .on("click", click)
            .call(wrap,18);
    });

    function wrap(text, length) {
      text.each(function() {

        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.48, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            transform = text.attr("transform"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.html().length > length) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan")
                      .attr("x", x)
                      .attr("y", y)
                      .attr("dx", (-tspan.node().getComputedTextLength()) + "px")
                      .attr("dy", lineHeight + dy + "em")
                      .text(word);
          }
        }
      });
    }

    function click(d) {
      svg.transition()
          .duration(750)
          .tween("scale", function() {
            var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
                yd = d3.interpolate(y.domain(), [d.y, 1]),
                yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
            return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
          })
        .selectAll("path")
          .attrTween("d", function(d) { return function() { return arc(d); }; });

      svg.transition()
          .duration(750)
          .tween("scale", function() {
            var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
                yd = d3.interpolate(y.domain(), [d.y, 1]),
                yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
            return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
          })
        .selectAll("text")
          .attrTween("transform", function(d) {
            return function() { 
                if(d.x == 0 && d.y == 0)
                {
                  return "translate("+0+","+0+") rotate("+0+")";
                }
                var angle = Math.min(2 * Math.PI, x(d.x + d.dx/2));
                var r = Math.max(0, y(d.y + entity_values[d.depth]/100/2));
                var xPos = r*Math.sin(angle);
                var yPos = -r*Math.cos(angle);
                var rotate_value = Math.round(angle/Math.PI * 180);
                return "translate("+xPos+","+yPos+") rotate("+rotate_value+")";
            }; 
          })
          .style("fill-opacity", function(t) {
              if(isIn(d,t)) return 1;
              return 0;
          });
    }

    d3.select(self.frameElement).style("height", height + "px");
  }