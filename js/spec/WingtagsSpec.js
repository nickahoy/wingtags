describe("Position", function() {
  it("should exist", function() {
    var position = new Position();
    expect(position).toExist();
  });
});

describe("LocationProvider", function() {

  beforeEach(function() {
    this.locationProvider = new LocationProvider();
  });

  describe("When geolocation is not available", function() {
    beforeEach(function() {
      this.locationProvider.isAvailable = function() { return false; }
    });

    it("should raise an error on getCurrentPosition()", function() {
      var spy = sinon.spy();
      this.locationProvider.on('didFailToUpdateLocation', spy);

      this.locationProvider.getCurrentPosition();

      expect(spy.calledOnce).toBeTruthy();
    });
  });

  describe("on success", function() {
    it("should raise a didUpdateLocation event", function() {
      var spy = sinon.spy();
      this.locationProvider.on('didUpdateLocation', spy);
  
      var position = {}; 
      this.locationProvider.onSuccess(position);
  
      expect(spy.calledWith(position)).toBeTruthy();
    });
  });

  describe("on failure", function() {
    it("should raise a didFailToUpdateLocation event", function() {
      var spy = sinon.spy();
      this.locationProvider.on('didFailToUpdateLocation', spy);

      var error = {};
      this.locationProvider.onError(error);

      expect(spy.calledWith(error)).toBeTruthy();
    });
  });
});

describe("LocationView", function() {

  beforeEach(function() {
    this.locationView = new LocationView();
    this.locationView.locationProvider = new LocationProvider();
  });

  describe("When GPS is not available:", function() {

    beforeEach(function() {
      this.locationView.locationProvider.isAvailable = function() { return false; };
    });

    it("Instantiates an AddressView", function() {
      this.locationView.render();
      expect(this.locationView.addressView).toExist();
    });

    it("Does not instantiate a CoordinateView", function() {
      this.locationView.render();
      expect(this.locationView.CoordinateView).not.toExist();
    });

    it("Renders a suburb field", function() {
      var el = this.locationView.render().$el;
      expect(el).toContainElement('#suburb');
    });

    it("Renders a street field", function() {
      var el = this.locationView.render().$el;
      expect(el).toContainElement('#street');
    });
  });

  describe("When GPS is available", function() {

    beforeEach(function() {
      this.locationView.locationProvider.isAvailable = function() { return true; }
    });

    it("Instantiates a CoordinateView", function() {
      this.locationView.render();
      expect(this.locationView.coordinateView).toExist();
    });

    it("Does not instantiate an AddressView", function() {
      this.locationView.render();
      expect(this.locationView.addressView).not.toExist();
    });

    it("Renders a gps status field", function() {
      var el = this.locationView.render().$el;
      expect(el).toContainElement('span#gps-status');
    });

    describe("When location is updated", function() {

      beforeEach(function() {
        this.geoStub = { 
          coords: {
            latitude: 33.882973359510984,
            longitude: 151.26951911449567,
            altitude: null,
            accuracy: 65, 
            altitudeAccuracy: null,
            heading: null,
            speed: null
          }, 
          timestamp: 415836029296
        }
      });

      it("should render new coords in view", function() {
        this.locationView.trigger('didUpdateLocation', [this.geoStub]);
      });
    });
  });
});

describe("AppView", function() {

  beforeEach(function() {
    setFixtures("<div id='app-container'><div id='tag-capture'></div><div id='location-captyer'</div></div>");
    this.appView = new AppView();
  });

  describe("initialize()", function() {

    it("should instantiate an ImageProvider", function() {
      expect(this.appView.imageProvider).toExist();
    });
  
    it("should instantiate a LocationProvider", function() {
      expect(this.appView.locationProvider).toExist();
    });
  
    it("should instantiate an IdentifierView", function() {
      var view = _.find(this.appView.subviews, function(view) { return view instanceof IdentifierView; })
      expect(view).toExist();
    });
  
    it("should instantiate a LocationView", function() {
      var view = _.find(this.appView.subviews, function(view) { return view instanceof LocationView; })
      expect(view).toExist();
    });
  
    it("should instantiate an ImageView if browser supports camera capture", function() {
      this.appView.subviews = [];
      this.appView.imageProvider.isAvailable = function() { return true; };
      this.appView.initializeSubviews();
  
      var view = _.find(this.appView.subviews, function(view) { return view instanceof ImageView; })
      expect(view).toExist();
    });
  
    it("should not instantiate an ImageView if browser does not support camera capture", function() {
      this.appView.subviews = [];
      this.appView.imageProvider.isAvailable = function() { return false; };
      this.appView.initializeSubviews();
  
      var view = _.find(this.appView.subviews, function(view) { return view instanceof ImageView; })
      expect(view).not.toExist();
    });
  });

  describe("render()", function() {

    it("should call render on all subviews", function() {

      var locationProvider = new LocationProvider();
      locationProvider.isAvailable = function() { return true; }

      var imageProvider = new ImageProvider();
      imageProvider.isAvailable = function() { return true; }

      this.appView.locationProvider = locationProvider;
      this.appView.imageProvider = imageProvider;

      this.appView.initializeSubviews();
      this.appView.subviews.map(function(view) { sinon.spy(view, 'render'); });

      this.appView.render();
      this.appView.subviews.map(function(view) { expect(view.render.calledOnce).toBeTruthy; });
    }); 

    it("should return itself", function() {
      var returnedObj = this.appView.render();
      expect(returnedObj).toBe(this.appView);
    });
  });
});


describe("IdentifierView", function() {

  beforeEach(function() {
    this.identifierView = new IdentifierView();
  });

  describe("render()", function() {
    it("should contain an input#animal-identifier field", function() {
      var el = this.identifierView.render().el;
      expect(el).toContainElement('input#animal-identifier');
    });

    it("should return itself", function() {
      var obj = this.identifierView.render();
      expect(obj).toBe(this.identifierView);
    });
  });
});

describe("ImageView", function() {

  beforeEach(function() {
    this.imageView = new ImageView();
  });

  describe("render()", function() {

    it("should render an input#camera-input element", function() {
      var el = this.imageView.render().el;
      expect(el).toContainElement('input#camera-input');
    });

    it("should render an a#camera-select element with class 'button'", function() {
      var el = this.imageView.render().el;
      expect(el).toContainElement('a#camera-select');
      expect($(el).find('a#camera-select')).toHaveClass('button');
    });

    it("should return itself", function() {
      var obj = this.imageView.render();
      expect(obj).toBe(this.imageView);
    });
  });

  describe("when 'Add Photo' is clicked", function() {
    it("should fire a click event on the input element", function() {
      var $el = this.imageView.render().$el;
      var spyEvent = spyOnEvent($el.find('#camera-input'), 'click');

      $el.find('#camera-select').click();
      expect(spyEvent).toHaveBeenTriggered();
    });
  });
});
