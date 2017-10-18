Due: 11:59pm, Friday Oct 20

Goal: In this assignment you will practice basic modeling and implement transforms and lighting on 3D objects using the WebGL rasterization API.

Submission: Submit your assignment using this Google Form.


BASIC GRADING:
The main components of this programming assignment are:
10% Part 0: properly turned in assignment
10% Part 1: render the input triangles, without lighting
20% Part 2: model and render the input ellipsoids, without lighting
20% Part 3: light the ellipsoids and triangles
15% Part 4: interactively change view
5% Part 5: interactively select a model
10% Part 6: interactively change lighting
10% Part 7: interactively transform the ellipsoids and triangles
Participation: Receive participation credit (outside of this assignment) for posting images of your progress, good or bad, on the class forum!

General:
You will only render triangles and ellipsoids in this assignment, described in the same sorts of JSON input files used in the first. We will test your program using several different input files, so it would be wise to test your program with several such files. The input files describe arrays of triangles and ellipsoids using JSON. Example input files reside at https://ncsucgclass.github.io/prog2/triangles.json and https://ncsucgclass.github.io/prog2/ellipsoids.json. When you turn in your program, you should use these URLs in hardcode as the locations of the input triangles and ellipsoids files — they will always be there. While testing, you should use a different URL referencing a file that you can manipulate, so that you can test multiple triangles and ellipsoid files. Note that browser security makes loading local files difficult, so we encourage you to access any input files with HTTP GET requests.

We provide a small shell in which you can build your code. You can run the shell here, and see its code and assets here. The shell shows how to draw triangles using WebGL without any model or view transform, and how to parse the input triangles.json file.

The default view and light are as in the first assignment. The eye is at (0.5,0.5,-0.5), view up of [0 1 0], look at vector [0 0 1]. The window has XY view coordinates (0,1,0,1), and is located at view Z=0. Once more, with this default view everything in the world is in view if it is located in a 1x1x1 box with one corner at the origin, and another at (1,1,1). Put a white (1,1,1) (for ambient, diffuse and specular) light at location (-1,3,-0.5).

You should code the core of this assignment yourself. You may not use others' code to transform or project models or perform Blinn-Phong lighting. You may use math, matrix and modeling libraries you find, but you must credit them in comments. You may recommend libraries to one another, speak freely with one another about your code or theirs, but you may never directly provide any code to another student. If you are ever uncertain if what you are contemplating is permissible, simply ask me or the TA.

Part 0: Properly turned in assignment
Remember that 10% of your assignment grade is for correctly submitting your work! For more information about how to correctly submit, see this page on the class website.

Part 1: Render the input triangles, without lighting
Use rasterization to render unlit triangles, giving each triangle its unmodified diffuse color (e.g, if the diffuse color of the triangle is (1,0,0), every pixel in it should be red). You will have to use vertex shaders to perform viewing and perspective transforms, and fragment shaders to select the diffuse color. We recommend the use of the glMatrix library for creating these transforms.

Part 2: Render the input ellipsoids, without lighting
Use rasterization to render unlit ellipsoids, giving each ellipsoid its unmodified diffuse color. There are no ellipsoid primitives available in WebGL, so you will have to build an ellipsoid out of triangles, then transform it to the right location and size. You can do this statically with a hardcoded sphere model, or procedurally with a latitude/longitude parameterization. You then scale this sphere to match its ellipsoidal parameters. Again you will have to use vertex shaders to perform viewing and perspective transforms, fragment shaders to select color.

Part 3: Light the ellipsoids and triangles
Shade the ellipsoids and triangles using per-fragment shading and the Blinn-Phong illumination model, using the reflectivity coefficients you find in the input files. Use triangle normals during lighting (which will reveal faceting on your ellipsoids). Your fragment shaders will perform the lighting calculation.

Part 4: interactively change view
Use the following key to action table to enable the user to change the view:
a and d — translate view left and right along view X
w and s — translate view forward and backward along view Z
q and e — translate view up and down along view Y
A and D — rotate view left and right around view Y (yaw)
W and S — rotate view forward and backward around view X (pitch)
To implement these changes you will need to change the eye, lookAt and lookUp vectors used to form your viewing transform.

Part 5: Interactively select a model
Use the following key to action table to interactively select a certain model:
left and right — select and highlight the next/previous triangle set (previous off)
up and down — select and highlight the next/previous ellipsoid (previous off)
space — deselect and turn off highlight
A triangle set is one entry in the input triangle array. To highlight, uniformly scale the selection by 20% (multiply x y and z by 1.2). To turn highlighting off, remove this scaling. You will have to associate a transform matrix with each ellipsoid and triangle to maintain state, and apply this transform in your vertex shaders. glMatrix will also be helpful here.

Part 6: Interactively change lighting on a model
Use the following key to action table to interactively change lighting on the selected model:
b — toggle between Phong and Blinn-Phong lighting
n — increment the specular integer exponent by 1 (wrap from 20 to 0)
1 — increase the ambient weight by 0.1 (wrap from 1 to 0)
2 — increase the diffuse weight by 0.1 (wrap from 1 to 0)
3 — increase the specular weight by 0.1 (wrap from 1 to 0)
When toggling between Phong and Blinn-Phong, apply this change to globally to all models. All other changes should apply only to the selected model.
Part 7: Interactively transform models
Use the following key to action table to interactively transform the selected model:
k and ; — translate selection left and right along view X
o and l — translate selection forward and backward along view Z
i and p — translate selection up and down along view Y
K and : — rotate selection left and right around view Y (yaw)
O and L — rotate selection forward and backward around view X (pitch)
I and P — rotate selection clockwise and counterclockwise around view Z (roll)
Translate the model after you rotate it (so the model rotates around itself), and after the highlighting scale (see above, so the model doesn't translate as it scales).

