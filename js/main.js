(function($) {

  window.JST = {};

  window.JST['animal-identifier'] = _.template("<div class='row'><div class='large-6 columns'><input type='number' min='0' max='999' id='animal-identifier' placeholder='Tag number' autofocus></div></div>");
  window.JST['location/address'] = _.template("<div id='address-template'><div class='row'><div class='large-6 columns'><div class='row'><div class='large-12 columns'><label for='suburb'>Suburb</label><input id='suburb' name='Suburb' type='text' /></div></div><div class='row'><div class='large-12 columns'><label for='street'>Street</label><input id='street' name='Street' type='text' /></div></div></div></div>");
  window.JST['location/gps'] = _.template("<div id='coordinate-template'><div class='row'><div class='large-6 columns'><div class='panel'><p><span id='gps-status'>Getting Location...</span></p></div></div></div>");
  window.JST['image'] = _.template("\
    <div class='row'> \
      <div class='large-6 columns' id='image-container'> \
        <input type='file' capture='camera' accept='image/*' id='camera-input' name='camera-input' style='display:none'> \
        <a href='#' id='camera-select' class='button expand'>Add Photo</a> \
      </div> \
    </div>");

  window.Geo = Backbone.Model.extend({

    initialize: function() {
      _.bindAll(this, 'isAvailable', 'getCurrentPosition');

      if (this.isAvailable) { 
        this.geoProvider = window.navigator.geolocation;
        this.getCurrentPosition();
      }
    }, 

    isAvailable:  function() {
      return 'geolocation' in window.navigator;
    },

    getCurrentPosition: function() {
      var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000
      };
    }
  });

  window.Position = Backbone.Model.extend({});

  window.LocationProvider = Backbone.Model.extend({

    initialize: function() {
      _.bindAll(this, 'isAvailable', 'getCurrentPosition', 'success', 'error');

      if (this.isAvailable()) { 
        this._base = window.navigator.geolocation;
      }
    }, 

    isAvailable:  function() {
      return 'geolocation' in window.navigator;
    },

    getCurrentPosition: function() {
      var options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 120000
      };

      this._base.getCurrentPosition(this.success, this.error, options);
    },

    success: function(position) { 
      this.trigger('didUpdateLocation', position);
      console.log('didUpdateLocation: ', position); 
    },

    error: function(error) { 
      this.trigger('didFailToUpdateLocationWithError', error);
      console.log('didFailToUpdateLocationWithError: ', error); 
    }
  });

  window.ImageProvider = Backbone.Model.extend({

    isAvailable: function() {
      //return 'capture' in document.createElement('input');
      if(navigator.userAgent.match(/(Android (1.0|1.1|1.5|1.6|2.0|2.1))|(Windows Phone (OS 7|8.0))|(XBLWP)|(ZuneWP)|(w(eb)?OSBrowser)|(webOS)|(Kindle\/(1.0|2.0|2.5|3.0))/)) {
        return false;
      } else {
        return true;
      }
    }
  });

  window.Address = Backbone.Model.extend({

  });

  window.IdentifierView = Backbone.View.extend({

    template: window.JST['animal-identifier'],

    initialize: function() {
      _.bindAll(this, 'render');
    },

    render: function() {
      this.$el.html(this.template());
      return this;
    }

  });

  window.ImageView = Backbone.View.extend({

    events: {
      'click #camera-select': 'getImage'
    },

    template: window.JST['image'],

    initialize: function() {
      _.bindAll(this, 'render', 'getImage');
    },

    render: function() {
      this.$el.html(this.template());
      return this;
    },

    getImage: function(event) {
      event.preventDefault();
      console.log('imageView el: ', this.$el.find('#camera-input'));
      this.$el.find('#camera-input').click();
    }

  });

  window.AppView = Backbone.View.extend({

    initialize: function() {
      _.bindAll(this, 
        'render', 
        'renderSubview',
        'initializeSubviews',
        'initializeLocationView',
        'initializeImageView');
      this.subviews = [];
      this.imageProvider = new ImageProvider();
      this.locationProvider = new LocationProvider();
      this.initializeSubviews();
    },

    render: function() {
      this.subviews.forEach(this.renderSubview);
      return this;
    },

    renderSubview: function(subview, index, array) {
      var el = subview.render().el;
      this.$el.append(el);
    },

    initializeSubviews: function() {
      this.subviews.push(new IdentifierView());
      this.initializeLocationView();
      this.initializeImageView();
    },

    initializeLocationView: function() {
      var view = new LocationView();
      view.locationProvider = this.locationProvider;
      view.geoProvider = new Geo(); // REMOVE
      this.subviews.push(view);
    },

    initializeImageView: function() {
      if (this.imageProvider.isAvailable()) {
        this.subviews.push(new ImageView());
      }
    }


  });

  window.LocationView = Backbone.View.extend({

    initialize: function() {
      _.bindAll(this, 
        'render',
        'renderCoordinateView',
        'renderAddressView');
    },

    render: function() {
      if (this.geoProvider.isAvailable()) {
        this.renderCoordinateView();        
      } else {
        this.renderAddressView();
      }
      return this;
    },

    renderCoordinateView: function() {
      this.coordinateView = new CoordinateView({
        geoProvider: this.geoProvider
      });
      
      this.$el.append(this.coordinateView.render().el);
    },

    renderAddressView: function() {
      this.addressView = new AddressView({
        model: new Address()
      });

      this.$el.append(this.addressView.render().el);
    }
  });

  window.CoordinateView = Backbone.View.extend({
    
    template: window.JST['location/gps'],//$('#coordinate-template').html()),
  
    initialize: function() {
      _.bindAll(this, 'render');
    },

    render: function() {
      $(this.el).html(this.template());
      return this;
    }
  });

  window.AddressView = Backbone.View.extend({

    template: window.JST['location/address'],//$("#address-template").html()),

    initialize: function() {
      _.bindAll(this, 'render');
    },

    render: function() {
      $(this.el).html(this.template());
      return this;
    }

  });

  //$(document).ready(function() {
//
  //    window.AppView = Backbone.View.extend({
  //      template: _.template($("#container-template").html()),
//
  //      initialize: function() {
  //        _.bindAll(this, 'render');
  //      },
//
  //      render: function() {
  //        $(this.el).html(this.template());
  //        return this;
  //      }
  //    });
//
  //    window.LocationView = Backbone.View.extend({
//
  //      initialize: function() {
  //        _.bindAll(this, 'render', 'renderCoordinateView');
  //      },
  //
  //      render: function() {
////          $(this.el).html(this.template());
  //        
  //        if (this.geoProvider.isAvailable) {
  //          this.renderCoordinateView();
  //        } else {
  //          this.renderAddressView();
  //        }
  //
  //        console.log(this.$el);
  //        return this;
  //      },
  //
  //      renderCoordinateView: function() {
  //        this.coordinateView = new CoordinateView({
  //          geoProvider: this.geoProvider
  //        });
  //
  //        var child = this.coordinateView.render();
  //        console.log('child: ', child);
  //        
  //        this.$el.append(this.coordinateView.render().$el);
  //        return this;
  //      },
  //
  //      renderAddressView: function() {
  //        this.addressView = new AddressView({
  //          model: new Address()
  //        });
  //
  //        this.addressView.render();
  //        return this;
  //      }
  //    });
//
  //    window.CoordinateView = Backbone.View.extend({
  //      template: _.template($('#gps-template').html()),
  //
  //      initialize: function() {
  //        _.bindAll(this, 'render');
  //      },
  //
  //      render: function() {
  //        $(this.el).html(this.template());
  //        return this;
  //      }
  //    });
//
  //    window.Wingtags = Backbone.Router.extend({
//
  //      routes: {
  //        '' : 'home'
  //      },
//
  //      initialize: function() {
  //        this.geo = new Geo();
  //        this.appView = new AppView();        
  //        this.locationView = new LocationView();
  //        this.locationView.geoProvider = this.geo;
  //        
  //      },
//
  //      home: function() {
  //        $('#app-container').empty();
  //        $('#app-container').append(this.appView.render().el);
  //        $('#app-container').append(this.locationView.render().el);
  //        console.log("Wingtags.home");
  //      }
  //    });
//
  //    window.App = new Wingtags();
  //    Backbone.history.start();
//
  //});
  
})(jQuery);

//$(function() {
//
//  window.Sighting = Backbone.Model.extend({ });
//  window.Geo = Backbone.Model.extend({});
//  window.Camera = Backbone.Model.extend({});
//
//  window.CameraView = Backbone.View.extend({});
//  window.LocationView = Backbone.View.extend({});
//
//  if ("geolocation" in navigator) {
//
//    var geo_options = {
//      enableHighAccuracy  : true,
//      maximumAge          : 30000,
//      timeout             : 27000
//    };
//
//    function geo_success(position) {
//      console.log("Lat: ", position.coords.latitude);
//      console.log("Lon: ", position.coords.longitude);
//      console.log("Acc: ", position.coords.accuracy);
//    };
//
//    function geo_error() {
//      display_street();
//    }
//
//    navigator.geolocation.getCurrentPosition(geo_success, geo_error, geo_options);
//  } else {
//    display_street();
//  };
//
//  var getMedia = (  navigator.getUserMedia ||
//                    navigator.webkitGetUserMedia ||
//                    navigator.mozGetUserMedia ||
//                    navigator.msGetUserMedia);
//
//  
//  function fileinput() {
//    if(navigator.userAgent.match(/(Android (1.0|1.1|1.5|1.6|2.0|2.1))|(Windows Phone (OS 7|8.0))|(XBLWP)|(ZuneWP)|(w(eb)?OSBrowser)|(webOS)|(Kindle\/(1.0|2.0|2.5|3.0))/)) {
//        return false;
//    } else {
//      return true;
//    }
//  }
//
//  if (fileinput()) {
//    $("#capture-image").html("<input type='file' capture='camera' accept='image/*' id='cameraInput' name='cameraInput'>");
//  }
//
//
//  function media_success() {}
//  function media_error() {}
//  var media_options = {}
//
//  function display_street() {
//    $("#location").html("<label for='suburb'>Suburb</label><input type='text' id='suburb' name='suburb'><label for='street'>Street</label><input type='text' id='street'>");
//  }
//
//});//