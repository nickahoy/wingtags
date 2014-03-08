(function($) {

  window.JST = {};

  window.JST['animal-identifier'] = _.template("<div class='row'><div class='large-6 columns'><input type='number' min='0' max='999' id='animal-identifier' placeholder='Tag number' autofocus></div></div>");
  window.JST['location/address'] = _.template("<div id='address-template'><div class='row'><div class='large-6 columns'><div class='row'><div class='large-12 columns'><label for='suburb'>Suburb</label><input id='suburb' name='Suburb' type='text' /></div></div><div class='row'><div class='large-12 columns'><label for='street'>Street</label><input id='street' name='Street' type='text' /></div></div></div></div>");
  window.JST['location/gps'] = _.template("<div id='coordinate-template'><div class='row'><div class='large-6 columns'><div class='panel'><p><span id='gps-status'>Latitude: <%= latitude %>, Longitude: <%= longitude %></span></p></div></div></div>");
  window.JST['location/pending'] = _.template("<div id='coordinate-template'><div class='row'><div class='large-6 columns'><div class='panel'><p><span id='gps-status'>Getting Location...</span></p></div></div></div>");
  window.JST['submit'] = _.template("<div class='row'><div class='large-6 columns' id='image-container'><a href='#'' class='success button expand'>Submit</a></div></div>");


  window.JST['image'] = _.template("\
    <div class='row'> \
      <div class='large-6 columns' id='image-container'> \
        <input type='file' capture='camera' accept='image/*' id='camera-input' name='camera-input' style='display:none'> \
        <a href='#' id='camera-select' class='button expand'>Add Photo</a> \
      </div> \
    </div>");

  window.Position = Backbone.Model.extend({

    initialize: function(options) {
      _.bindAll(this, 'setAttributesFromGeoposition');

      if (options !== undefined) {
        if (options.geoposition !== undefined) {
          this.setAttributesFromGeoposition(options.geoposition);
        }
      }
    },

    setAttributesFromGeoposition: function(geoposition) {
      this.set(geoposition.coords);
      this.set({ timestamp: geoposition.timestamp });
    }

  });

  window.LocationProvider = Backbone.Model.extend({

    initialize: function() {
      _.bindAll(this, 'isAvailable', 'getCurrentPosition', 'onSuccess', 'onError');

      if (this.isAvailable()) { 
        this._base = window.navigator.geolocation;
      }
    }, 

    isAvailable:  function() {
      return 'geolocation' in window.navigator;
    },

    getCurrentPosition: function() {
      if (this.isAvailable()) {
        var options = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 120000
        };
  
        this._base.getCurrentPosition(this.onSuccess, this.onError, options);
      } else
      {
        this.onError();
      }
    },

    onSuccess: function(position) { 
      var positionModel = new Position({ geoposition: position });
      this.set('lastLocation', positionModel);
      this.trigger('didUpdateLocation', positionModel);
      console.log('didUpdateLocation: ', positionModel); 
    },

    onError: function(error) { 
      this.trigger('didFailToUpdateLocation', error);
      console.log('didFailToUpdateLocation: ', error); 
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

  window.Address = Backbone.Model.extend({ });

  $(document).ready(function() {
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
  
      tagName: 'form', 
  
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
        this.$el.append(JST['submit']());
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
        this.subviews.push(view);
      },
  
      initializeImageView: function() {
        if (this.imageProvider.isAvailable()) {
          this.subviews.push(new ImageView());
        }
      }
  
  
    });
  
    window.LocationView = Backbone.View.extend({
  
      initialize: function(options) {
        _.bindAll(this, 
          'render',
          'renderCoordinateView',
          'renderAddressView');
  
        if (options !== undefined) {
          this.locationProvider = options.locationProvider;
        }
      },
  
      render: function() {
        if (this.locationProvider.isAvailable()) {
          this.renderCoordinateView();        
        } else {
          this.renderAddressView();
        }
        return this;
      },
  
      renderCoordinateView: function() {
        this.coordinateView = new CoordinateView({
          locationProvider: this.locationProvider
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
    
      initialize: function(options) {
        _.bindAll(this, 'render', 'renderPosition');
  
        if (options !== undefined) {
          if (options.locationProvider !== undefined) {
            this.locationProvider = options.locationProvider;
            this.locationProvider.on('didUpdateLocation', this.renderPosition);
          }
        }
      },
  
      render: function() {
        var lastLocation = this.locationProvider.get('lastLocation');
        
        if (lastLocation === undefined) {
          $(this.el).html(JST['location/pending']());
        } else
        {
          this.renderPosition(lastLocation);
        }
        return this;
      },
  
      renderPosition: function(position) {
        $(this.el).html(this.template( {latitude: position.get('latitude'), longitude: position.get('longitude')} ));
        console.log('el: ', this.$el);
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
  
    window.Wingtags = Backbone.Router.extend({
      routes: { '': 'home' },
  
      initialize: function() {
        this.appView = new AppView();
        this.appView.locationProvider.getCurrentPosition();
      },
  
      home: function() {
        $('#app-container').empty();
        $('#app-container').append(this.appView.render().el);
      }
    });
  
    window.App = new Wingtags();
    Backbone.history.start();
  });
})(jQuery);