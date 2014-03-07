(function($) {
  window.Geo = Backbone.Model.extend({

    initialize: function() {
      this.geoProvider = window.navigator;
    }, 

    isAvailable:  function() {
      return 'geolocation' in this.geoProvider;
    }

  });

  $(document).ready(function() {
    window.LocationView = Backbone.View.extend({

      initialize: function() {
        _.bindAll(this, 'render', 'renderCoordinateView');
      },

      render: function() {
        $(this.el).html(this.template());
        

        if (this.geoProvider.isAvailable) {
          this.renderCoordinateView();
        } else {
          this.renderAddressView();
        }

        console.log(this.$el);
        return this;
      },

      renderCoordinateView: function() {
        this.coordinateView = new CoordinateView({
          geoProvider: this.geoProvider
        });

        var child = this.coordinateView.render();
        console.log('child: ', child);
        
        this.$el.append(this.coordinateView.render().$el);
        return this;
      },

      renderAddressView: function() {
        this.addressView = new AddressView({
          model: new Address()
        });

        this.addressView.render();
        return this;
      }
    });

    window.CoordinateView = Backbone.View.extend({
      template: _.template($('#gps-template').html()),

      initialize: function() {
        _.bindAll(this, 'render');
      },

      render: function() {
        $(this.el).html(this.template());
        return this;
      }
    });
  });
})(jQuery);




//window.WT = window.WT != null ? window.WT : { };
//window.WT.Geo = Geo;