/// ----- ZUI change begin -----
/// Add jquery object to namespace

/// (function(){ // Old code
(function($){

/// ----- ZUI change end -----
    "use strict";

/// ----- ZUI change begin -----
/// Change root to zui shared object
/// 
///   var root = this, // old code
      var root = $ && $.zui ? $.zui : this,
/// ----- ZUI change end -----
        Chart = root.Chart,
        //Cache a local reference to Chart.helpers
        helpers = Chart.helpers;

    var defaultConfig = {
        //Boolean - Whether we should show a stroke on each segment
        segmentShowStroke: true,

        //String - The colour of each segment stroke
        segmentStrokeColor: "#fff",

        //Number - The width of each segment stroke
/// ZUI change begin
///        segmentStrokeWidth: 2, // old code
        segmentStrokeWidth: 1,
/// ZUI change end

        //The percentage of the chart that we cut out of the middle.
        percentageInnerCutout: 50,

/// ZUI change begin
        // Boolean - Whether to show labels on the scale
        scaleShowLabels: false,

        // Interpolated JS string - can access value
        scaleLabel: "<%=value%>",

        // String - Scale label position
        scaleLabelPlacement: 'auto',

///        Number - Amount of animation steps // old code
///        animationSteps: 100, // old code
        animationSteps: 60,
/// ZUI change end

        //String - Animation easing effect
        animationEasing: "easeOutBounce",

        //Boolean - Whether we animate the rotation of the Doughnut
        animateRotate: true,

        //Boolean - Whether we animate scaling the Doughnut from the centre
        animateScale: false,

        //String - A legend template
        legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>"

    };


    Chart.Type.extend(
    {
        //Passing in a name registers this chart in the Chart namespace
        name: "Doughnut",
        //Providing a defaults will also register the deafults in the chart namespace
        defaults: defaultConfig,
        //Initialize is fired when the chart is initialized - Data is passed in as a parameter
        //Config is automatically merged by the core of Chart.js, and is available at this.options
        initialize: function(data)
        {

            //Declare segments as a static property to prevent inheriting across the Chart type prototype
            this.segments = [];
            this.outerRadius = (helpers.min([this.chart.width, this.chart.height]) - this.options.segmentStrokeWidth / 2) / 2;

            this.SegmentArc = Chart.Arc.extend(
            {
                ctx: this.chart.ctx,
                x: this.chart.width / 2,
                y: this.chart.height / 2
            });

            //Set up tooltip events on the chart
            if (this.options.showTooltips)
            {
                helpers.bindEvents(this, this.options.tooltipEvents, function(evt)
                {
                    var activeSegments = (evt.type !== 'mouseout') ? this.getSegmentsAtEvent(evt) : [];

                    helpers.each(this.segments, function(segment)
                    {
                        segment.restore(["fillColor"]);
                    });
                    helpers.each(activeSegments, function(activeSegment)
                    {
                        activeSegment.fillColor = activeSegment.highlightColor;
                    });
                    this.showTooltip(activeSegments);
                });
            }
            this.calculateTotal(data);

            helpers.each(data, function(datapoint, index)
            {
                this.addData(datapoint, index, true);
            }, this);

            this.render();
        },
        getSegmentsAtEvent: function(e)
        {
            var segmentsArray = [];

            var location = helpers.getRelativePosition(e);

            helpers.each(this.segments, function(segment)
            {
                if (segment.inRange(location.x, location.y)) segmentsArray.push(segment);
            }, this);
            return segmentsArray;
        },
        addData: function(segment, atIndex, silent)
        {
/// ----- ZUI change begin -----
/// Init segment color
            if($.zui && $.zui.Color && $.zui.Color.get)
            {
                var color = new $.zui.Color.get(segment.color);
                segment.color = color.toCssStr();
                if(!segment.highlight) segment.highlight = color.lighten(5).toCssStr();
            }
/// ----- ZUI change begin -----
            var index = atIndex || this.segments.length;
            this.segments.splice(index, 0, new this.SegmentArc(
            {
                id: typeof segment.id === 'undefined' ? index : segment.id, 
                value: segment.value,
                outerRadius: (this.options.animateScale) ? 0 : this.outerRadius,
                innerRadius: (this.options.animateScale) ? 0 : (this.outerRadius / 100) * this.options.percentageInnerCutout,
                fillColor: segment.color,
                highlightColor: segment.highlight || segment.color,
                showStroke: this.options.segmentShowStroke,
                strokeWidth: this.options.segmentStrokeWidth,
                strokeColor: this.options.segmentStrokeColor,
                startAngle: Math.PI * 1.5,
                circumference: (this.options.animateRotate) ? 0 : this.calculateCircumference(segment.value),
                label: segment.label
            }));
            if (!silent)
            {
                this.reflow();
                this.update();
            }
        },
        calculateCircumference: function(value)
        {
            return (Math.PI * 2) * (Math.abs(value) / this.total);
        },
        calculateTotal: function(data)
        {
            this.total = 0;
            helpers.each(data, function(segment)
            {
                this.total += Math.abs(segment.value);
            }, this);
        },
        update: function()
        {
            this.calculateTotal(this.segments);

            // Reset any highlight colours before updating.
            helpers.each(this.activeElements, function(activeElement)
            {
                activeElement.restore(['fillColor']);
            });

            helpers.each(this.segments, function(segment)
            {
                segment.save();
            });
            this.render();
        },

        removeData: function(atIndex)
        {
            var indexToDelete = (helpers.isNumber(atIndex)) ? atIndex : this.segments.length - 1;
            this.segments.splice(indexToDelete, 1);
            this.reflow();
            this.update();
        },

        reflow: function()
        {
            helpers.extend(this.SegmentArc.prototype,
            {
                x: this.chart.width / 2,
                y: this.chart.height / 2
            });
            this.outerRadius = (helpers.min([this.chart.width, this.chart.height]) - this.options.segmentStrokeWidth / 2) / 2;
            helpers.each(this.segments, function(segment)
            {
                segment.update(
                {
                    outerRadius: this.outerRadius,
                    innerRadius: (this.outerRadius / 100) * this.options.percentageInnerCutout
                });
            }, this);
        },
/// ZUI change begin
        drawLabel: function(segment, easeDecimal)
        {
            var options = this.options;
            var middleAngle = (segment.endAngle + segment.startAngle) / 2;
            var placement = options.scaleLabelPlacement;
            if(placement !== 'inside' && placement !== 'outside') {
                if((this.chart.width - this.chart.height) > 50) {
                    if(segment.circumference < (Math.PI / 36)) {
                        placement = 'outside';
                    }
                }
            }

            var x = Math.cos(middleAngle) * segment.outerRadius,
                y = Math.sin(middleAngle) * segment.outerRadius,
                text = helpers.template(options.scaleLabel, {value: typeof easeDecimal === 'undefined' ? segment.value : Math.round(easeDecimal * segment.value), label: segment.label});

            var ctx = this.chart.ctx;
            ctx.font = helpers.fontString(options.scaleFontSize, options.scaleFontStyle, options.scaleFontFamily);

            var textWidth = ctx.measureText(text).width;
            var chartWidthHalf = this.chart.width / 2;
            var chartHeightHalf = this.chart.height / 2;

            if(placement === 'outside') {
                var isRight = x >= 0;
                var lineX = x + chartWidthHalf;
                var lineY = y + chartHeightHalf;
                if(isRight)
                {
                    x = Math.max(chartWidthHalf + segment.outerRadius + 10, x + 30 + chartWidthHalf);
                } else {
                    x = Math.min(chartWidthHalf - segment.outerRadius - 10 - textWidth, x - 30 + chartWidthHalf - textWidth);
                }
                y = Math.max(15, Math.min(this.chart.height - 15, y + chartHeightHalf - 20));

                ctx.beginPath();
                ctx.moveTo(lineX, lineY);
                ctx.lineTo(isRight ? (x - 5) : (x + 5 + textWidth), y + 7);
                ctx.lineTo(isRight ? (x + textWidth + 5) : (x - 5), y + 7)
                ctx.strokeStyle = ($.zui && $.zui.Color) ? (new $.zui.Color(segment.fillColor).fade(20).toCssStr()) : segment.fillColor;
                ctx.strokeWidth = options.scaleLineWidth;
                ctx.stroke();
                ctx.closePath();

                ctx.fillStyle = segment.fillColor;
                x += 5;
            } else { // outside
                x = x * 0.7 + chartWidthHalf;
                y = y * 0.7 + chartHeightHalf;
                ctx.fillStyle = ($.zui && $.zui.Color) ? (new $.zui.Color(segment.fillColor).contrast().toCssStr()) : '#fff';

                x -= textWidth / 2;
                y -= 6;
            }

            ctx.fillText(text, x, y);
        },
// ZUI change end
        draw: function(easeDecimal)
        {
            var animDecimal = (easeDecimal) ? easeDecimal : 1;
            this.clear();
            helpers.each(this.segments, function(segment, index)
            {
                segment.transition(
                {
                    circumference: this.calculateCircumference(segment.value),
                    outerRadius: this.outerRadius,
                    innerRadius: (this.outerRadius / 100) * this.options.percentageInnerCutout
                }, animDecimal);

                segment.endAngle = segment.startAngle + segment.circumference;

                segment.draw();
                if (index === 0)
                {
                    segment.startAngle = Math.PI * 1.5;
                }
                //Check to see if it's the last segment, if not get the next and update the start angle
                if (index < this.segments.length - 1)
                {
                    this.segments[index + 1].startAngle = segment.endAngle;
                }

/// ZUI change begin
                if(this.options.scaleShowLabels)
                {
                    this.drawLabel(segment, easeDecimal);
                }
/// ZUI change end
            }, this);

        }
    });

    Chart.types.Doughnut.extend(
    {
        name: "Pie",
        defaults: helpers.merge(defaultConfig,
        {
            percentageInnerCutout: 0
        })
    });

/// ----- ZUI change begin -----
/// Use jquery object to create Chart object
    $.fn.pieChart = function(data, options)
    {
        var pieCharts = [];
        this.each(function(){
            var $this = $(this);
            pieCharts.push(new Chart(this.getContext("2d")).Pie(data, $.extend($this.data(), options)));
        });
        return pieCharts.length === 1 ? pieCharts[0] : pieCharts;
    }

    $.fn.doughnutChart = function(data, options)
    {
        var doughnutCharts = [];
        this.each(function(){
            var $this = $(this);
            doughnutCharts.push(new Chart(this.getContext("2d")).Doughnut(data, $.extend($this.data(), options)));
        });
        return doughnutCharts.length === 1 ? doughnutCharts[0] : doughnutCharts;
    }

/// ----- ZUI change end -----

/// ----- ZUI change begin -----
/// Add jquery object to namespace

/// }).call(this); // Old code
}).call(this, jQuery);

/// ----- ZUI change end -----
