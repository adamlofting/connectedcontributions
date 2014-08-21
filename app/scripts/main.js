'use strict';
// var width = 600,
//     height = 500;

// var color = d3.scale.category20();

// var force = d3.layout.force()
//     .charge(-320)
//     .linkDistance(180)
//     .size([width, height]);

// var svg = d3.select('#chart').append('svg')
//     .attr('width', width)
//     .attr('height', height);

// d3.json('/data.json', function(error, graph) {
//     force
//       .nodes(graph.nodes)
//       .links(graph.links)
//       .start();

//     var link = svg.selectAll('.link')
//       .data(graph.links)
//       .enter().append('line')
//       .attr('class', 'link')
//       .style('stroke-width', function(d) { return Math.sqrt(d.value/30); });

//     var node = svg.selectAll('.node')
//       .data(graph.nodes)
//       .enter().append('circle')
//       .attr('class', 'node')
//       .attr('r', function(d) { return d.size/30; })
//       .style('fill', function(d) { return color(d.group); })
//       .call(force.drag);

//     node.append('title')
//       .text(function(d) { return d.name; });

//     force.on('tick', function() {
//         link.attr('x1', function(d) { return d.source.x; })
//         .attr('y1', function(d) { return d.source.y; })
//         .attr('x2', function(d) { return d.target.x; })
//         .attr('y2', function(d) { return d.target.y; });

//         node.attr('cx', function(d) { return d.x; })
//         .attr('cy', function(d) { return d.y; });
//     });
// });

var margin = {top: 180, right: 0, bottom: 10, left: 180},
    width = 500,
    height = 500;


var svg = d3.select('#chart').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .style('margin-left', -margin.left + 'px')
  .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

d3.json('../data.json', function(data) {
    var linkExtent = d3.extent(data.links, function (d) { return d.value; });

    var x = d3.scale.ordinal().rangeBands([0, width]),
    z = d3.scale.linear().domain(linkExtent).clamp(true),
    c = d3.scale.category10().domain(d3.range(10));

    var matrix = [],
    nodes = data.nodes,
    n = nodes.length;

    // Compute index per node.
    nodes.forEach(function(node, i) {
        node.index = i;
        node.count = 0;
        matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
    });

    // Convert links to matrix; count character occurrences.
    data.links.forEach(function(link) {
        matrix[link.source][link.target].z = link.value;
        matrix[link.target][link.source].z = link.value;
        // matrix[link.source][link.source].z = link.value;
        // matrix[link.target][link.target].z = link.value;
        // nodes[link.source].count = link.value;
        // nodes[link.target].count = link.value;
    });

    // Precompute the orders.
    var orders = {
        name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
        count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
        group: d3.range(n).sort(function(a, b) { return nodes[b].group - nodes[a].group; })
    };

    // The default sort order.
    x.domain(orders.count);

    svg.append('rect')
        .attr('class', 'background')
        .attr('width', width)
        .attr('height', height);

    var row = svg.selectAll('.row')
        .data(matrix)
        .enter().append('g')
        .attr('class', 'row')
        .attr('transform', function(d, i) { return 'translate(0,' + x(i) + ')'; })
        .each(row);

    row.append('line')
        .attr('x2', width);

    row.append('text')
        .attr('x', -6)
        .attr('y', x.rangeBand() / 2)
        .attr('dy', '.32em')
        .attr('text-anchor', 'end')
        .text(function(d, i) { return nodes[i].name; });

    var column = svg.selectAll('.column')
        .data(matrix)
        .enter().append('g')
        .attr('class', 'column')
        .attr('transform', function(d, i) { return 'translate(' + x(i) + ')rotate(-90)'; });

    column.append('line')
        .attr('x1', -width);

    column.append('text')
        .attr('x', 6)
        .attr('y', x.rangeBand() / 2)
        .attr('dy', '.32em')
        .attr('text-anchor', 'start')
        .text(function(d, i) { return nodes[i].name; });

    function row(row) {
        var cell = d3.select(this).selectAll('.cell')
        .data(row.filter(function(d) { return d.z; }))
        .enter().append('rect')
        .attr('class', 'cell')
        .attr('x', function(d) { return x(d.x); })
        .attr('width', x.rangeBand())
        .attr('height', x.rangeBand())
        .attr('title', function(d) { return d.z + ' people'; })
        .style('fill-opacity', function(d) { return z(d.z); })
        .style('fill', function(d) { return nodes[d.x].group === nodes[d.y].group ? c(nodes[d.x].group) : null; })
        .on('mouseover', mouseover)
        .on('mouseout', mouseout);
    }

    function mouseover(p) {
        d3.selectAll('.row text').classed('active', function(d, i) { return i === p.y; });
        d3.selectAll('.column text').classed('active', function(d, i) { return i === p.x; });
    }

    function mouseout() {
        d3.selectAll('text').classed('active', false);
    }

    d3.select('#order').on('change', function() {
        clearTimeout(timeout);
        order(this.value);
    });

    function order(value) {
        x.domain(orders[value]);

        var t = svg.transition().duration(2500);

        t.selectAll('.row')
            .delay(function(d, i) { return x(i) * 4; })
            .attr('transform', function(d, i) { return 'translate(0,' + x(i) + ')'; })
        .selectAll('.cell')
            .delay(function(d) { return x(d.x) * 4; })
            .attr('x', function(d) { return x(d.x); });

        t.selectAll('.column')
            .delay(function(d, i) { return x(i) * 4; })
            .attr('transform', function(d, i) { return 'translate(' + x(i) + ')rotate(-90)'; });
    }

    var timeout = setTimeout(function() {
        order('count');
        d3.select('#order').property('selectedIndex', 2).node().focus();
    }, 5000);
});
