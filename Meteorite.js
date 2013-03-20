
var tvShowColl = new Meteor.Collection("tvShows");

if(Meteor.isServer) {
      Meteor.startup(function () {
       Meteor.publish("tvShows", function() {
         return tvShowColl.find(
            {},
            {fields:{Category:1}});
       });
     });
}

if (Meteor.isClient) {
   Meteor.nest = function(options){
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
   Meteor.nest.prototype.makeReactive = function(fun){
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
   Meteor.nest.prototype.kill = function(){ 
      this.$el.remove();
      delete this;
   }
   Meteor.nest.prototype.insertReactiveSubviewIntoListItemViaSession = function(settings){
      var self2 = this;
      Meteor.subscribe(settings.subscriptionName, function(){
         settings.listParent$el[settings.targetParentMethod](
            self2.makeReactive( 
               function(){
                  if(typeof Session.get(settings.viewIdPrefix+settings.viewId) !== 'undefined'){ 
                     if(typeof settings.selfSubviewAssignment !== 'undefined'){settings.selfSubviewAssignment.kill()}
                     settings.selfSubviewAssignment = settings.viewGenerator(settings.viewId); 
                     if(settings.findString !== ''){
                        settings.listItem$el.find('.id-'+Session.get(settings.viewIdPrefix+settings.viewId)).find(settings.findString).append(settings.selfSubviewAssignment.$el)
                     } else {
                        settings.listItem$el.find('.id-'+Session.get(settings.viewIdPrefix+settings.viewId)).append(settings.selfSubviewAssignment.$el) 
                     } 
                  }
               }
            )
         )         
      })
   }

   function renderTemplateToBody() {
      var linkListViewGenerator = function(){ return new Meteor.nest({
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
            "click h3": function (e, tmpl) {
               alert(this.hint)
            }
         }}
      })};


      var characterListViewGenerator = function(viewId){ return new Meteor.nest({  
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
            },
            "click .addCharacterButton": function (e, tmpl) {
               var newCharacter = $(e.target).closest('li').find('.addCharacter').val();
               var currentTvShowId = Session.get('selectedTvShow'+viewId);
               var currentCharactersArray = tvShowColl.findOne({_id:currentTvShowId}).characters;
               currentCharactersArray.push(newCharacter);
               tvShowColl.update({'_id':currentTvShowId}, {$set:{characters:currentCharactersArray}});
            }
         }}
      })};



      var tvShowListViewGenerator = function(viewId){ return new Meteor.nest({
         parentElementClass:'parentClass',
         handlebarsName:'tvShowList',
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
            },
            "click .editNameButton": function (e, tmpl) {
               console.log(this._id)
               var newName = ($(e.target).closest('.member').find('.editName').val())
               tvShowColl.update({'_id':this._id}, {$set:{name:newName}});
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
            $el.find('h2').after(currentSelectionWrapper)

            //Insert a subview into this tvShowListView container
            $el.append(linkListViewGenerator().$el); 

            //Insert subviews into individual list items within this tvShowListView container, based on current selection
            self.insertReactiveSubviewIntoListItemViaSession(
               {
                  listItem$el:$el,
                  viewId:viewId,
                  viewIdPrefix:'selectedTvShow',
                  subscriptionName:'tvShows',
                  selfSubviewAssignment:self.charactersView,
                  viewGenerator:characterListViewGenerator,
                  listParent$el:$el,
                  targetParentMethod:'append',
                  findString:'.listItemSubViewInsertionPoint'
               }
            )
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
//tvShowColl.update({'_id':'Gm4mkTbFp2cymaiYk'}, {$set:{characters:['ddd','eeee','gggddas']}});