```mermaid
flowchart LR
  subgraph path2 [Path]
    2["Path<br>[48, 73, 0]"]
    3["Segment<br>[81, 96, 0]"]
    4["Segment<br>[104, 119, 0]"]
    5["Segment<br>[127, 143, 0]"]
    6["Segment<br>[151, 159, 0]"]
    7[Solid2d]
  end
  subgraph path24 [Path]
    24["Path<br>[248, 273, 0]"]
    25["Segment<br>[285, 300, 0]"]
    26["Segment<br>[312, 327, 0]"]
    27["Segment<br>[339, 355, 0]"]
    28["Segment<br>[367, 375, 0]"]
    29[Solid2d]
  end
  1["Plane<br>[21, 40, 0]"]
  8["Sweep Extrusion<br>[407, 422, 0]"]
  9[Wall]
  10[Wall]
  11[Wall]
  12[Wall]
  13["Cap Start"]
  14["Cap End"]
  15["SweepEdge Opposite"]
  16["SweepEdge Adjacent"]
  17["SweepEdge Opposite"]
  18["SweepEdge Adjacent"]
  19["SweepEdge Opposite"]
  20["SweepEdge Adjacent"]
  21["SweepEdge Opposite"]
  22["SweepEdge Adjacent"]
  23["Plane<br>[217, 236, 0]"]
  30["Sweep Extrusion<br>[459, 473, 0]"]
  31[Wall]
  32[Wall]
  33[Wall]
  34[Wall]
  35["Cap Start"]
  36["Cap End"]
  37["SweepEdge Opposite"]
  38["SweepEdge Adjacent"]
  39["SweepEdge Opposite"]
  40["SweepEdge Adjacent"]
  41["SweepEdge Opposite"]
  42["SweepEdge Adjacent"]
  43["SweepEdge Opposite"]
  44["SweepEdge Adjacent"]
  1 --- 2
  2 --- 3
  2 --- 4
  2 --- 5
  2 --- 6
  2 ---- 8
  2 --- 7
  3 --- 12
  3 --- 21
  3 --- 22
  4 --- 11
  4 --- 19
  4 --- 20
  5 --- 10
  5 --- 17
  5 --- 18
  6 --- 9
  6 --- 15
  6 --- 16
  8 --- 9
  8 --- 10
  8 --- 11
  8 --- 12
  8 --- 13
  8 --- 14
  8 --- 15
  8 --- 16
  8 --- 17
  8 --- 18
  8 --- 19
  8 --- 20
  8 --- 21
  8 --- 22
  23 --- 24
  24 --- 25
  24 --- 26
  24 --- 27
  24 --- 28
  24 ---- 30
  24 --- 29
  25 --- 34
  25 --- 43
  25 --- 44
  26 --- 33
  26 --- 41
  26 --- 42
  27 --- 32
  27 --- 39
  27 --- 40
  28 --- 31
  28 --- 37
  28 --- 38
  30 --- 31
  30 --- 32
  30 --- 33
  30 --- 34
  30 --- 35
  30 --- 36
  30 --- 37
  30 --- 38
  30 --- 39
  30 --- 40
  30 --- 41
  30 --- 42
  30 --- 43
  30 --- 44
```