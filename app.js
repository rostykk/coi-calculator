const layoutOptions = {
  name: 'dagre',
  align: 'UR',
  rankDir: 'LR',
  rankSep: 100,
  padding: 10,
  animate: true,
  animationDuration: 100,
  animationEasing: 'ease-in-out-quad'
};

const styleOptions = [ // the stylesheet for the graph
// {
//   selector: 'node',
//   style: {
//     'background-color': '#666',
//     'label': 'data(id)'
//   }
// },

{
  selector: "node",
  css: {
    label: "data(label)", //access the nodes data with "data(...)"
    // label: "data(id)",
    padding: 20,
    "text-wrap": "wrap",
    "text-max-width": 120, 
    "text-valign": "center",
    "text-halign": "center",
    // height: "60px",
    width: "100px",
    shape: "data(shape)",
    "background-color": "data(color)"
  }
},

// {
//   selector: "arrow",
//   css: {
//     "arrow-scale": 2,
//     "target-arrow-color": "black"
//   }
// },

// {
//   selector: "node[type==TYPE_MINE]",
//   css: {
//     "background-color": "red"
//   }
// },

{
  selector: 'edge',
  style: {
    label: "data(label)",
    "text-valign": "top",
    "text-margin-y": "-10",
    "arrow-scale": 2,
    'width': 3,
    'line-color': '#666',
    'target-arrow-color': '#666',
    'target-arrow-shape': 'vee',

    // 'source-arrow-shape': 'tee',
    // 'source-arrow-color': '#666',
    
    // 'curve-style': 'taxi',
    'curve-style': 'bezier'
  }
}
];

const fetchJson = async (title) => {
  return fetch(title)
  .then(res => res.json())
}

const fetchProducts = async () => {
  return fetchJson('./dist/products.json')
}

const fetchCommonChains = async () => {
  return fetchJson('./common_recipes.json')
}

const fetchRecipes = async () => {
  return fetchJson('./dist/recipes.json')
}

const fetchMachines = async () => {
  return fetchJson('./dist/machines.json')
}

let machineData = {}

const getMachine = (machine_id) => {
  return machineData[machine_id]
}

const findInRecipes = (wanted_product_id, recipes, category_key) => {
  // console.log(category_key, category_key !== "outputs" || category_key !== "inputs")
  if (category_key !== "outputs" && category_key !== "inputs") {
    throw new Error("`category_key` has to be either `outputs` or `inputs`")
  }
  const foundRecipes = []
  Object.keys(recipes).forEach((recipe_key) => {
    const recipe = recipes[recipe_key]
    recipe[category_key].forEach((obj) => {
      if (obj.id === wanted_product_id) {
        foundRecipes.push(recipe)
      }
    })
  })
  return foundRecipes
}

const renderRecipes = async (product_id) => {
  const $output = document.querySelector('#outputs');
  const recipes = await fetchRecipes()
  console.log(recipes)
  const wantedRecipes = findInRecipes(product_id, recipes, "outputs")
  console.log(wantedRecipes)

  wantedRecipes.forEach((recipe) => {
    if (recipe.machine.includes('storage')) {
      return
    }
    // console.log(JSON.stringify(recipe, null, 2))
    console.log(recipe)
    const $child = document.createElement('div')
    $child.className = 'recipe'

    const $inputs = document.createElement('span')

    $inputs.innerText = recipe.inputs.reduce((acc, curr) => {
      return acc + ' ' + curr.name + "(" + curr.quantity + ")"
    }, '')

    $child.appendChild($inputs)

    const $machine = document.createElement('span')
    $machine.innerText = " => " + recipe.name + " in " + recipe.machine + " => "

    $child.appendChild($machine)

    const $outputs = document.createElement('span')

    $outputs.innerText = recipe.outputs.reduce((acc, curr) => {
      return acc + ' ' + curr.name + "(" + curr.quantity + ")"
    }, '')

    $child.appendChild($outputs)

    // const $child_output = document.createElement('pre')
    // $child_output.innerHTML = JSON.stringify(recipe, null, 2)
    // $child.appendChild($child_output)

    $output.appendChild($child)
  })
}

const TYPE_MINE = 'TYPE_MINE'

const rawMaterials = [
  "coal",
  "copper_ore",
  "dirt",
  "gold_ore",
  "iron_ore",
  "limestone",
  "quartz",
  "rock",
  "sand",
  "seawater",
  "sulfur",
  "uranium_ore",
  "wood",
  "water",
]

const getNodes = async (product_id, category_key) => {
  const products = await fetchProducts()
  console.log('products', products)

  const recipes = await fetchRecipes()
  console.log(recipes)
  
  const wantedRecipes = findInRecipes(product_id, recipes, category_key)
  console.log(wantedRecipes)

  const filteredRecipes = wantedRecipes.filter((recipe) => !recipe.machine.includes('storage'))
  return filteredRecipes.map((firstRecipe) => {
    
    const input_nodes = firstRecipe.inputs.map((product) => {
      let isRawMaterial = false
      if (rawMaterials.includes(product.id)) {
        isRawMaterial = true
      }
      return {
        group: "nodes",
        data: {
          id: product.id,
          label: product.name,
          shape: "ellipse",
          color: isRawMaterial ? 'indianred' : 'lightgreen',
        }
      }
    })

    const output_nodes = firstRecipe.outputs.map((product) => {
      return {
        group: "nodes",
        data: {
          id: product.id,
          label: product.name,
          shape: product.id.includes('pollution') ? 'heptagon' : "ellipse",
          color: product.id.includes('pollution') ? 'lightsalmon' : 'lightgreen',
        }
      }
    })

    let type = null;

    if (firstRecipe.machine.includes('_mine')) {
      type = TYPE_MINE
    }

    const middle_node_id = `${firstRecipe.id}+${firstRecipe.machine}`

    let machine = getMachine(firstRecipe.machine)
    const machine_name = machine.name

    const middle_node = {
      group: "nodes",
      
      data: {
        id: middle_node_id,
        label: `${firstRecipe.name} (${machine_name})`,
        // label: firstRecipe.machine + ' ' + firstRecipe.name,
        // label: `${firstRecipe.name}${firstRecipe.machine}`,
        // label: firstRecipe.name + '
        // ' + firstRecipe.machine,
        shape: firstRecipe.machine.includes("mine") ? "hexagon" : "rectangle",
        color: firstRecipe.machine.includes("mine") ? 'orange' : 'lightblue',
      }
    }

    const input_edges = firstRecipe.inputs.map((product) => {
      return {
        group: "edges",
        data: {
        id: product.id+middle_node_id,
        label: product.quantity,
        source: product.id,
        target: middle_node_id,
      }}
    })

    const output_edges = firstRecipe.outputs.map((product) => {
      return {
        group: "edges",
        data: {
        id: product.id+middle_node_id,
        label: product.quantity,
        target: product.id,
        source: middle_node_id
      }}
    })

    return [...input_nodes, ...output_nodes, ...[middle_node], ...input_edges, ...output_edges]
  })
}

const fillSelectWithProducts = async () => {
  const $select = document.querySelector('#selected-output select')
  const products = await fetchProducts();
  Object.keys(products).forEach((key) => {
    const product = products[key]
    const $option = document.createElement('option')
    $option.value = product.id
    $option.innerText = product.name
    $select.appendChild($option)
  })
  $select.addEventListener('change', (newVal) => {
    console.log(newVal)
    window.location.hash = newVal.target.value
    // renderGraphs(newVal.target.value)
  })
}

const createCytoGraph = ($container, elements, userZoomingEnabled) => {
  var cy = cytoscape({

    container: $container, // container to render in
  
    elements: elements,

    userZoomingEnabled: userZoomingEnabled,
  
    style: styleOptions,
  
    layout: layoutOptions
  
  });

  cy.on('tap', 'node', function(evt){
    var node = evt.target;
    console.log( 'tapped ' + node.id() );
    goToProduct(node.id())
  });

  // cy.on('dbltap', 'node', function(evt) {
  //   cy.remove(evt.target)
  // })

  return cy
}

let main_graph = null;

const initMainGraph = ($main_graph, elements) => {
  $main_graph.innerHTML = ''
  const cy = createCytoGraph($main_graph, elements, true)
  main_graph = cy;
}

const addElementsToSection = ($container_element, $main_graph, recipes) => {
  recipes.forEach((elements) => {
    const $cy = document.createElement('div')
    $cy.className = 'cy'
    $container_element.appendChild($cy)

    const cy = createCytoGraph($cy, elements, false)

    const $addGraph = document.createElement('button')
    $addGraph.innerText = 'Add'
    $addGraph.style.zIndex = 10000000;
    $addGraph.addEventListener('click', () => {
      window.scrollTo(0,0)
      if (main_graph === null) {
        initMainGraph($main_graph, elements)
      } else {
        elements.forEach((element) => {
          console.log(element)
          const foundElements = main_graph.getElementById(element.data.id);
          console.log(foundElements)
          if (foundElements.size() === 0) {
            const new_node = Object.assign({}, {group: "nodes"}, element)
            console.log('new_node', new_node)
            main_graph.add(new_node)
          }
        })
        const layout = main_graph.layout(layoutOptions);
        layout.run();
      }
      
    })

    $cy.appendChild($addGraph);
  })
}

const renderGraphs = async (product_id) => {
  const $main_graph = document.querySelector('#main-graph');

  const $outputs = document.querySelector('#outputs');
  const $inputs = document.querySelector('#inputs');

  $outputs.innerHTML = ''
  $inputs.innerHTML = ''

  const outputRecipes = await getNodes(product_id, "outputs")
  const inputRecipes = await getNodes(product_id, "inputs")

  addElementsToSection($outputs, $main_graph, outputRecipes)
  addElementsToSection($inputs, $main_graph, inputRecipes)
  
  if (main_graph) {
    main_graph.resize();
  }
}

const goToProduct = (product_id) => {
  window.location.hash = product_id
}

const promiseTimeout = (time_ms) => {
  return new Promise((resolve) => {
    window.setTimeout(resolve, time_ms)
  })
}

const importData = async (data) => {
  initMainGraph(document.querySelector('#main-graph'), [])
  const decoded = LZString.decompressFromBase64(data)
  const json = JSON.parse(decoded)
  console.log('parsed data', json)
  
  // main_graph.json(Object.assign({}, json, {style: styleOptions}))

  const layout = main_graph.layout(layoutOptions);
  layout.run();

  main_graph.json({
    zoom: json.zoom,
    pan: json.pan
  })

  for (const element of json.elements.nodes) {
    await promiseTimeout(10)
    main_graph.add(element)
  }

  for (const element of json.elements.edges) {
    await promiseTimeout(10)
    main_graph.add(element)
    // const layout = main_graph.layout(layoutOptions);
    // layout.run();
  }

  // const layout = main_graph.layout(layoutOptions);
  // layout.run();
  // main_graph.resize()
}

const main = async () => {
  await fillSelectWithProducts();

  machineData = await fetchMachines();

  const $reset = document.querySelector('#reset_layout')
  $reset.addEventListener('click', () => {
    const layout = main_graph.layout(layoutOptions);
    layout.run();
    main_graph.resize();
  })

  const $export = document.querySelector('#export');
  const $import = document.querySelector('#import');
  const $common = document.querySelector('#common-recipes')

  const common_chains = await fetchCommonChains()
  common_chains.forEach((obj) => {
    const $el = document.createElement('button')
    
    $el.innerText = obj.title
    $el.addEventListener('click', () => {
      importData(obj.data)
    })

    $common.appendChild($el)
  })

  $export.addEventListener('click', () => {
    const data = main_graph.json();
    const json = JSON.stringify(data);
    const base64_encoded = LZString.compressToBase64(json);
    console.log(base64_encoded, base64_encoded.length)
    // window.alert(base64_encoded)
    navigator.clipboard.writeText(base64_encoded);
    window.alert("Sharable text has been copied to your clipboard")
  })

  $import.addEventListener('click', () => {
    const data = window.prompt("Paste export data here")
    importData(data)
  })
  
  if (window.location.hash !== "") {
    const product_id = window.location.hash.substr(1);
    console.log(product_id)
    // goToProduct(product_id)
    renderGraphs(product_id);
    document.querySelector("#selected-output select").value = product_id
  }

  window.onhashchange = function() {
    const product_id = window.location.hash.substr(1);
    console.log(product_id)
    // goToProduct(product_id)
    renderGraphs(product_id);
    document.querySelector("#selected-output select").value = product_id
  }

}

cytoscape.use(cytoscapeDagre)

main()
