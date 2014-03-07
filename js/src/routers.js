Var Router = Backbone.Router.extend({
  routes: {
    '' : 'home'
  },

  initialize: function() {
    this.appView = new AppView
  },

  home: function() {

  }
})