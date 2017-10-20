Changes

Please use keys
z and x - to highlight the Ellipsoids
c and v to highlight the triangle
and space is used to reset all effects to try multiple things

All other are as given



To use this project

a and d — translate view left and right along view X
w and s — translate view forward and backward along view Z
q and e — translate view up and down along view Y
A and D — rotate view left and right around view Y (yaw)
W and S — rotate view forward and backward around view X (pitch)


Part 5: Interactively select a model
Use the following key to action table to interactively select a certain model:

space — deselect and turn off highlight
A triangle set is one entry in the input triangle array. To highlight, uniformly scale the selection by 20% (multiply x y and z by 1.2). To turn highlighting off, remove this scaling. You will have to associate a transform matrix with each ellipsoid and triangle to maintain state, and apply this transform in your vertex shaders. glMatrix will also be helpful here.

Part 6: Interactively change lighting on a model
Use the following key to action table to interactively change lighting on the selected model:
b — toggle between Phong and Blinn-Phong lighting
n — increment the specular integer exponent by 1 (wrap from 20 to 0)
1 — increase the ambient weight by 0.1 (wrap from 1 to 0)
2 — increase the diffuse weight by 0.1 (wrap from 1 to 0)
3 — increase the specular weight by 0.1 (wrap from 1 to 0)

Part 7: Interactively transform models
Use the following key to action table to interactively transform the selected model:
k and ; — translate selection left and right along view X
o and l — translate selection forward and backward along view Z
i and p — translate selection up and down along view Y
K and : — rotate selection left and right around view Y (yaw)
O and L — rotate selection forward and backward around view X (pitch)
I and P — rotate selection clockwise and counterclockwise around view Z (roll)