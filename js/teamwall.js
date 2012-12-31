function TeamwallApp() {

    var instruments = [];
    var canvases = [];
    var dashboardConfiguration;

    this.loadDashboard = function loadDashboard(dashboardConfigurationFile) {


        $.ajax({
            url: dashboardConfigurationFile,
            dataType: 'json',
            cache: false,
            success: function configureDashboard(config) {
                dashboardConfiguration = config;
                instruments = createInstruments(config.instruments);
                canvases = createInstrumentCanvases(instruments, config.layouts);
                drawCanvases(canvases);
                $(function () {
                    $("canvas").draggable({
                        grid: [ 10, 10 ],
                        start: function () {
                            var canvas = this;
                            canvas.style.zIndex = 10;
                        },
                        stop: function () {

                            var layouts = [];
                            jQuery.each(canvases, function () {
                                var canvas = this;
                                var layout = {};
                                layout.id = canvas.id;
                                layout.top = canvas.offsetTop;
                                layout.left = canvas.offsetLeft;
                                layout.width = canvas.width;
                                layout.height = canvas.height;
                                layouts.push(layout);
                                canvas.style.zIndex = 1;
                            });

                            var instrumentConfigurations = [];
                            jQuery.each(instruments, function() {
                               instrumentConfigurations.push(this.getConfiguration())
                            });

                            var teamwallConfiguration = {};
                            teamwallConfiguration.layouts = layouts;
                            teamwallConfiguration.instruments = instrumentConfigurations;

                            console.log(JSON.stringify(teamwallConfiguration));
                        }
                    });
                });
            },
            statusCode: {
                404: error404
            }
        });

        function drawCanvases(canvases) {
            jQuery.each(canvases, function () {
                document.body.appendChild(this);
            })
        }

        function error404() {
            alert("Please add a " + dashboardConfigurationFile + " file to the installation.");
        }

        function createInstruments(instrumentConfigurations) {
            var instruments = [];
            jQuery.each(instrumentConfigurations, function () {
                var instrument;
                var instrumentConfiguration = this;

                switch (instrumentConfiguration.instrument) {
                    case "percent" :
                        instrument = teamwall.instrument.percent(instrumentConfiguration);
                        break;
                    case "buildchain" :
                        instrument = teamwall.instrument.buildChain(instrumentConfiguration);
                        break;
                    case "number" :
                        instrument = teamwall.instrument.number(instrumentConfiguration);
                        break;
                    case "buildalert" :
                        instrument = teamwall.instrument.buildAlert(instrumentConfiguration);
                        break;
                    case "textarea" :
                        instrument = teamwall.instrument.textArea(instrumentConfiguration);
                        break;
                    default:
                        break;
                }
                if (instrument) {
                    instruments.push(instrument);
                }
            });
            return instruments;
        }

        function createInstrumentCanvases(instruments, layoutConfiguration) {
            var DEFAULT_WIDTH = 300;
            var DEFAULT_HEIGHT = 300;
            var canvases = [];

            for (var i = 0; i < instruments.length; i++) {
                var instrument = instruments[i];
                for (var j = 0; j < layoutConfiguration.length; j++) {
                    var layout = layoutConfiguration[j];
                    if (layout.id == instrument.getConfiguration().id) {
                        var canvas = document.createElement("canvas");
                        canvas.id = layout.id;
                        canvas.width = layout.width ? layout.width : DEFAULT_WIDTH;
                        canvas.height = layout.height ? layout.height : DEFAULT_HEIGHT;
                        $(canvas).css({
                            position: "absolute",
                            top: layout.top,
                            left: layout.left
                        });
                        canvas.style.zIndex = 1;
                        canvases.push(canvas);
                    }
                }
            }
            return canvases;
        }

        window.setInterval(updateInstruments, 1000);
    };

    function updateInstruments() {
        jQuery.each(instruments, function () {
            var instrument = this;
            $.ajax({
                url: instrument.getConfiguration().url,
                dataType: 'json',
                cache: false,
                success: function (data) {
                    instrument.setValue(data);
                }
            });
        });
    }
}
