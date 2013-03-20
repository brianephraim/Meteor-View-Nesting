
var tvShowColl = new Meteor.Collection("tvShows");

if(Meteor.isServer) {
      Meteor.startup(function () {
       Meteor.publish("tvShows", function() {
         return tvShowColl.find(
            {},
            //{owner:this.userId},
            {fields:{Category:1}});
       });
     });
}


//tvShowColl.insert({name:"Boomer",owner:"Brian"})

if (Meteor.isClient) {
   Meteor.ite = function(options){
      var self = this;
      var defaults = {
         parentElementType:'div',
         parentElementClass:'',
         handlebarsName:'',
         obj:function(self){return {}},
         eventsMap:function(self){return {}},
         manipulation:function($el,self){}
      };
      var settings = $.extend({}, defaults, options); 
      self.template = Template[settings.handlebarsName];     
      self.childTemplate = Template[settings.handlebarsName+'Item'];   



      



      var returnHtml = (function(){
          self.template.helpers(settings.obj(self));
         return  self.template; 
      })()
      var frag = Spark.render(
         function(){
            return Spark.attachEvents(settings.eventsMap(self),returnHtml())
         } 
      )
      var $el = $(['<',settings.parentElementType,' class="',settings.parentElementClass,'"></',settings.parentElementType,'>'].join('')).append(frag);
      settings.manipulation($el,this,Template[settings.handlebarsName]);
      this.frag = frag;
      this.$el = $el;
      
   };
   Meteor.ite.prototype.makeReactive = function(fun){
      /**/
      var frag = Spark.render(
        function(){
          return Spark.isolate(
            fun
          );
        }
      );
      /*
      var frag = Spark.render(
         function () {
            return Spark.createLandmark({
               preserve: ['.x'],
               created: function () {
                  console.log("created", this, arguments);
               },
               rendered: function () {
                  console.log("rendered", this, arguments);
               },
               destroyed: function () {
                  console.log("destroyed", this, arguments);
               }
            },
            function (landmark) {
               return Spark.isolate( 
                  fun
                );
            });
         }
      );*/
      return frag;
   }
   Meteor.ite.prototype.kill = function(){
      this.$el.remove();
      delete this;
   }
   Meteor.ite.prototype.insertReactiveSubviewIntoListItemViaSession = function(self,$el,viewId,viewIdPrefix,subscriptionName,selfSubviewAssignment,viewGenerator,targetParent$el,targetParentMethod,findString){
      var self2 = self;
      Meteor.subscribe(subscriptionName, function(){
         targetParent$el[targetParentMethod](
            self.makeReactive( 
               function(){
                  if(typeof Session.get(viewIdPrefix+viewId) !== 'undefined'){ 
                     if(typeof selfSubviewAssignment !== 'undefined'){selfSubviewAssignment.kill()}
                     selfSubviewAssignment = viewGenerator(viewId); 
                     if(findString !== ''){
                        $el.find('.id-'+Session.get(viewIdPrefix+viewId)).find(findString).append(selfSubviewAssignment.$el)
                     } else {
                        $el.find('.id-'+Session.get(viewIdPrefix+viewId)).append(selfSubviewAssignment.$el) 
                     } 
                  }
               }
            )
         )         
      })
   }


   function renderTemplateToBody() {
      var linkListViewGenerator = function(){ return new Meteor.ite({
         parentElementClass:'linkListClass',
         handlebarsName:'linkList',
         obj:function(self){return {
            listDataContext: {
               title: "Helpful links",
               hint: "Find helpful links below"
            },
            items: function () {
               return [
                  {url:'http://www.imdb.com',name:'IMDB'},
                  {url:'http://www.tvguide.com',name:'Tv Guide'}
               ] ;
            }
         }},
         eventsMap:function(self){return {
            "click h2": function (e, tmpl) {
               alert(this.hint)
            }
         }}
      })};


      var characterListViewGenerator = function(viewId){ return new Meteor.ite({  
         parentElementClass:'characterListClass',
         handlebarsName:'characterList',
         parentElementType:'ul',
         obj:function(self){return {
            items: function () {
               var collection = tvShowColl.findOne({_id:Session.get('selectedTvShow'+viewId)});
               if(typeof collection !== 'undefined'){
                  self.itemsSourceData = collection.characters
               } else {
                  self.itemsSourceData = []
               }
               return self.itemsSourceData
            }
         }},
         eventsMap:function(self){return {
            "click": function (e, tmpl) {
               e.stopPropagation()
            }
         }}
      })};



      var tvShowListViewGenerator = function(viewId){ return new Meteor.ite({
         parentElementClass:'parentClass',
         handlebarsName:'pack',
         obj:function(self){return {
            listDataContext: {
               title: "TV Show List",
               hint: "Click the TV shows below to see their characters"
            }, 
            items: function () {
               self.itemsSourceData = tvShowColl.find({},{sort: {name: 1}});
               return self.itemsSourceData;
            }
         }},
         eventsMap:function(self){return {
            "click .member": function (e, tmpl) {
               Session.set('selectedTvShow'+viewId,this._id);
            },
            "click h2": function (e, tmpl) {
               alert(this.hint)
            }
         }}, 
         manipulation:function($el,self){
            //Insert a reactive string showing current selection
            var curentSelectionFrag = self.makeReactive( 
               function(){
                  var doc = tvShowColl.findOne({_id:Session.get('selectedTvShow'+viewId)});
                  var string = typeof doc !== 'undefined' ? doc.name : 'none selected';
                  return 'Current selection: '+string;
               } 
            );
            var currentSelectionWrapper = $('<p class="currentSelection"></p>');
            currentSelectionWrapper.append(curentSelectionFrag)
            $el.find('h1').after(currentSelectionWrapper)

            //Insert a subview into this tvShowListView container
            $el.append(linkListViewGenerator().$el); 

            //Insert subviews into individual list items within this tvShowListView container, based on current selection
            self.insertReactiveSubviewIntoListItemViaSession(self,$el,viewId,'selectedTvShow','tvShows',self.charactersView,characterListViewGenerator,$el,'append','.listItemSubViewInsertionPoint')
         }
      })};

      var $tvShowListView1 = tvShowListViewGenerator('tvShowListView1').$el;  
      var $tvShowListView2 = tvShowListViewGenerator('tvShowListView2').$el;
      
      var testButton = $('<button>HIDE/SHOW THE LIST BELOW</button>');

      var d = 0;
      testButton.on('click',function(){
         if(d === 0){
            $tvShowListView2.remove();
            d = 1;
         } else {
            $tvShowListView2 = tvShowListViewGenerator('tvShowListView2').$el;
            $('body').append($tvShowListView2);
            d = 0;
         }

      })

      $('body').append($tvShowListView1);
      $('body').append(testButton)
      $('body').append($tvShowListView2); 
      
     

   }

   Meteor.startup(renderTemplateToBody); 
}

if (Meteor.isServer) {
   Meteor.startup(function () {
      if (tvShowColl.find().count() === 0) {
         var data = [
            {
               name:'Game of Thrones',
               year:'2011',
               characters: ['Jon Snow','Tyrion Lannister','Daenerys Targaryen']
            },
            {
               name:'The Walking Dead',
               year:'2010',
               characters: ['Rick Grimes','Daryl Dixon','Glenn Rhee']
            }
         ]
         
         for (var i = 0; i < data.length; i++){
            tvShowColl.insert(data[i]);
         }
      }
   });
}

//tvShowColl.update({_id:'bHZfQpHQeF8GjkmBm'}, {name: 'Behemoth',color: 'blue',characters:['asdf','zxcv']});

//tvShowColl.update({'_id':'bHZfQpHQeF8GjkmBm'}, {$set:{color:'red'}});