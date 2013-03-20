
var catsColl = new Meteor.Collection("Cats");

if(Meteor.isServer) {
      Meteor.startup(function () {
       Meteor.publish("Cats", function() {
         return catsColl.find(
            {},
            //{owner:this.userId},
            {fields:{Category:1}});
       });
     });
}


//catsColl.insert({name:"Boomer",owner:"Brian"})

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
      /*
      var frag = Spark.render(
        function(){
          return Spark.isolate(
            fun
          );
        }
      );
      */
      
      var frag = Spark.render(
         /*
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
         */
            function (landmark) {
               return Spark.isolate( 
                  fun
                );
            }/*)
         }*/
      );
      console.log(frag)
      return frag;
   }
   Meteor.ite.prototype.kill = function(){
      this.$el.remove();
      delete this;
   }
   Meteor.ite.prototype.insertReactiveSubviewIntoListItemViaSession = function(self,$el,viewId,viewIdPrefix,subscriptionName,selfSubviewAssignment,viewGenerator,targetParent$el,targetParentMethod,findString){
      var self2 = self;
      function doit(){
         function doIt2(){
            console.log('eee')
            targetParent$el[targetParentMethod](
               self.makeReactive( 
                  function(){
                     console.log('ddd')
                     if(typeof Session.get(viewIdPrefix+viewId) !== 'undefined'){ 
                        //console.log(selfSubviewAssignment)
                        if(typeof selfSubviewAssignment !== 'undefined'){selfSubviewAssignment.kill()}
                        selfSubviewAssignment = viewGenerator(viewId); 
                        if(findString !== ''){
                           $el.find('.id-'+Session.get(viewIdPrefix+viewId)).find(findString).append(selfSubviewAssignment.$el)
                        } else {
                           $el.find('.id-'+Session.get(viewIdPrefix+viewId)).append(selfSubviewAssignment.$el) 
                        } 
                     }
                    /* */
                  }
               )
            )
         }
         doIt2()
         /*
         var collection = catsColl.find({}); 
         console.log(collection)
         collection.observe({
           changed: function (id, user) {
             $el.append('--booger--')
             console.log('asdf')
             doIt2()
           }
         });*/
      } 
      Meteor.subscribe(subscriptionName, doit)
      /*
      self.childTemplate.rendered = function(){ 
         console.log(this) 
         self2.$el.append('--booger--')

      }
      */
      
      
      /**/
      
   }


   function renderTemplateToBody() {
      var helpfulLinksViewGenerator = function(){ return new Meteor.ite({
         parentElementClass:'subviewInMainParent',
         handlebarsName:'linksList',
         obj:function(self){return {
            listDataContext: {
               title: "Useful links",
               hint: "click these links"
            },
            items: function () {
               return [
                  {url:'http://en.wikipedia.org/wiki/Cats',name:'Wikipedia/cats'},
                  {url:'http://icanhas.cheezburger.com/lolcats',name:'lolcats'}
               ] ;
            }
         }},
         eventsMap:function(self){return {
            "click h1": function (e, tmpl) {
               console.log(this.hint)
            }
         }}
      })};


      var nickNameListViewGenerator = function(viewId){ return new Meteor.ite({ 
         parentElementClass:'nickNames',
         handlebarsName:'nickNameList',
         parentElementType:'ul',
         obj:function(self){return {
            items: function () {
               var collection = catsColl.findOne({_id:Session.get('selectedCat'+viewId)});
               //console.log(collection)
               if(typeof collection !== 'undefined'){
                  self.itemsSourceData = collection.nickNames
               } else {
                  self.itemsSourceData = []
               }

               //self.itemsSourceData = catsColl.findOne({_id:'bHZfQpHQeF8GjkmBm'}).nickNames
               return self.itemsSourceData
            }
         }},
         eventsMap:function(self){return {//eventsMap
            "click": function (e, tmpl) {
               e.stopPropagation()
            }
         }}
      })};



      var catListViewGenerator = function(viewId){ return new Meteor.ite({
         parentElementClass:'parentClass',
         handlebarsName:'pack',//handlebarsName
         obj:function(self){return {//obj
            listDataContext: {
               title: "Cat List",
               hint: "cats"
            }, 
            items: function () {
               self.itemsSourceData = catsColl.find({},{sort: {name: 1}});
               return self.itemsSourceData;
            }
         }},
         eventsMap:function(self){return {//eventsMap
            "click .member": function (e, tmpl) {
               console.log('click') 
               Session.set('selectedCat'+viewId,this._id);
            },
            "click h1": function (e, tmpl) {
               console.log(this.hint)
            }
         }}, 
         manipulation:function($el,self){//manipulation
           // Meteor.subscribe('Cats', function(){ //subviews were not rendering on liveHtmlPush so I needed to subscribe.  Make sure server has a publish method. 
            console.log('tttt')
            self.insertReactiveSubviewIntoListItemViaSession(self,$el,viewId,'selectedCat','Cats',self.nickNamesView,nickNameListViewGenerator,$el,'append','.itemInsertionPoint')
            
            
            var frag = self.makeReactive( 
               function(){ 
                  return 'yyyyyyy'+Session.get('selectedCat'+viewId);
               } 
            );
            $el.append(frag)
           /* */
            $el.append(helpfulLinksViewGenerator().$el); 


            Session.set("title", "It's a bird.. it's a plane.. it's a Landmark!");

            $el.append(Spark.render(

               function () {

                  return Spark.createLandmark({
                     preserve: ['h1'],

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

                     function () {
                        // make reactive
                        var title = Session.get("title");

                        return [
                           "<h1>",
                        title,
                           "</h1>"].join("");
                     });
                  });
               }

            ));



         }
      })};

      var $catListView1 = catListViewGenerator('catListView1').$el; 
      //var $catListView2 = catListViewGenerator('catListView2').$el;
      
      var testButton = $('<button>HIDE/SHOW THE LIST BELOW</button>');

      var d = 0;
      testButton.on('click',function(){
         if(d === 0){
            $catListView2.remove();
            d = 1;
         } else {
            $catListView2 = catListViewGenerator('catListView2').$el;
            $('body').append($catListView2);
            d = 0;
         }

      })

      $('body').append($catListView1);
      $('body').append(testButton)
      //$('body').append($catListView2); 
      
     

   }

   Meteor.startup(renderTemplateToBody); 
}

if (Meteor.isServer) {
   Meteor.startup(function () {
      if (catsColl.find().count() === 0) {
         var data = [
            {
               name:'Boomer',
               color:'White',
               nickNames: ['Pontooner','Cow','Van Boomingfrau']
            },
            {
               name:'Behemoth',
               color:'Brown',
               nickNames: ['Mr.Z','Professor','That Other Cat']
            }
         ]
         
         for (var i = 0; i < data.length; i++){
            catsColl.insert(data[i]);
         }
      }
   });
}

//catsColl.update({_id:'bHZfQpHQeF8GjkmBm'}, {name: 'Behemoth',color: 'blue',nickNames:['asdf','zxcv']});

//catsColl.update({'_id':'bHZfQpHQeF8GjkmBm'}, {$set:{color:'red'}});