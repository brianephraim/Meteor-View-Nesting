Meteornest
=========

Templating framework within Meteor for configuring, instantiating, and nesting views.


I've been playing around with Meteor for a couple weeks.  The ease of setup and the powerful reactivity makes this something I want to stick with.  I was however frustrated by the difficulty of programmatically configuring, instantiating, destroying and nesting subviews.  This was something I could do fairly easily in Backbone.  

In Meteor, it was easy enough to turn subviews on and off with a session variables and {{#if something}} in the Handlebars template.  But this approach didn't allow me to programmatically decide which Handlebars template to use as a subview.  

I dug deeper into the Meteor and Spark documentation, and found cmather's EventedMind Meteor Videos which were super helpful.

This accomplishes the effect I desired of nesting views within other views.  Subviews survive hot code pushes and parentview destruction/resurrection.  

There are some critical issues.  Please fork.
