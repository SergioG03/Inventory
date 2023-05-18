const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');

const app = express();
const port = 5000;
const tempDir = 'temp';

// Crea el directorio 'temp' si no existe
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

app.use(session({
  secret: 'mysecret',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

const sequelize = new Sequelize('database', 'username', 'password', {
  dialect: 'sqlite',
  storage: 'inventory.db'
});

// Define models
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
});

const Product = sequelize.define('Product', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING
  },
  price: {
    type: DataTypes.FLOAT
  }
});


// Define associations
User.hasMany(Product, { foreignKey: 'userId', as: 'products' });
Product.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// Middleware: Require authentication
function requireAuth(req, res, next) {
  if (req.session.userId) {
    next(); 
  } else {
    res.redirect(403); 
  }
}

// Homepage route
app.get('/', (req, res) => {
  if (req.session.userId) {
    User.findByPk(req.session.userId, { include: ['products'] })
      .then(user => {
        if (!user) {
          res.redirect('/login');
        } else {
          res.redirect('/products');
        }
      })
      .catch(error => {
        console.error(error);
        res.sendStatus(500);
      });
  } else {
    res.redirect('/login');
  }
});

//Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  User.findOne({ where: { username } })
    .then(user => {
      if (!user || !bcrypt.compareSync(password, user.password)) {
        const message = 'Invalid credentials';
        res.render('login', { message }); // Render the login template with the error message
      } else {
        req.session.userId = user.id;
        req.session.username = user.username;
        res.redirect('/products');
      }
    })
    .catch(error => {
      console.error(error);
      res.sendStatus(500);
    });
});


// Login page route
app.get('/login', (req, res) => {
  res.render('login', { message: req.session.message });
});

// Register page route
app.get('/register', (req, res) => {
  res.render('register', { message: req.session.message });
});

// Register route
app.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  // Check if username or email already exist
  User.findOne({ where: { [Sequelize.Op.or]: [{ username }, { email }] } })
    .then((existingUser) => {
      if (existingUser) {
        req.session.message = 'Username or email already registered';
        res.redirect('/register');
      } else {
        // Hash the password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Create new user
        User.create({ username, password: hashedPassword, email })
          .then((newUser) => {
            req.session.userId = newUser.id;
            req.session.username = newUser.username;
            res.redirect('/login');
          })
          .catch((error) => {
            console.error(error);
            res.sendStatus(500);
          });
      }
    })
    .catch((error) => {
      console.error(error);
      res.sendStatus(500);
    });
});

// Logout route
app.get('/logout', (req, res) => {
  if (req.session.userId) {
    delete req.session.userId;
    delete req.session.username;
  }
  res.redirect('/login');
});

// Handle 403 Access Denied route
app.get('/403', (req, res) => {
  res.status(403).render('403');
});


// Products page route
app.get('/products', (req, res) => {
  const searchTerm = req.query.search || '';
  const searchValue = '%' + searchTerm + '%';

  Product.findAll({
    where: {
      name: {
        [Sequelize.Op.like]: searchValue
      }
    },
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['username']
      }
    ]
  })
    .then(products => {
      res.render('products', { products, username: req.session.username, searchTerm });
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error retrieving products');
    });
});



// Search page route
app.get('/search', requireAuth, (req, res) => {
  res.render('search', { searchTerm: '', products: [] });
});

// Search route
app.post('/search', requireAuth, (req, res) => {
  const searchTerm = req.body.searchTerm;
  const searchValue = '%' + searchTerm + '%';

  Product.findAll({
    where: {
      name: {
        [Sequelize.Op.like]: searchValue
      }
    },
    include: [
      {
        model: User,
        attributes: ['username'],
        as: 'owner'
      }
    ]
  })
    .then(products => {
      res.render('search', { searchTerm, products });
    })
    .catch(error => {
      console.error(error);
      res.sendStatus(500);
    });
});

// My Products page route
app.get('/myproducts', requireAuth, (req, res) => {
  const userId = req.session.userId;

  Product.findAll({
    where: { userId },
    include: [
      {
        model: User,
        attributes: ['username'],
        as: 'owner'
      }
    ]
  })
    .then(myProducts => {
      res.render('myproducts', { myProducts });
    })
    .catch(error => {
      console.error(error);
      res.sendStatus(500);
    });
});



// Create Product page route
app.get('/product/create', requireAuth, (req, res) => {
  res.render('createproduct', { message: req.session.message });
});

// Create Product route
app.post('/product/create', requireAuth, (req, res) => {
  const { name, description, price } = req.body;
  const userId = req.session.userId;

  Product.create({ name, description, price, userId })
    .then(() => {
      res.redirect('/products');
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error creating the product');
    });
});

// Agrega la ruta /download
app.get('/download', requireAuth, (req, res) => {
  // Obtén los productos desde la base de datos
  Product.findAll()
    .then(products => {
      // Genera el contenido del informe en formato CSV
      let csvContent = 'Name,Description,Price\n';
      products.forEach(product => {
        csvContent += `${product.name},${product.description},${product.price}\n`;
      });

      // Escribe el contenido en un archivo temporal
      const filePath = path.resolve(tempDir, 'products.csv');
      fs.writeFileSync(filePath, csvContent);

      // Establece los encabezados de respuesta para la descarga del archivo
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');

      // Envía el archivo como respuesta
      res.sendFile(filePath, {}, (err) => {
        if (err) {
          console.error(err);
          res.sendStatus(500);
        } else {
          // Elimina el archivo temporal después de enviarlo
          fs.unlinkSync(filePath);
        }
      });
    })
    .catch(error => {
      console.error(error);
      res.sendStatus(500);
    });
});


// Single Product page route
app.get('/product/:id', requireAuth, (req, res) => {
  const productId = req.params.id;
  const userId = req.session.userId;

  Product.findByPk(productId, {
    include: [
      {
        model: User,
        attributes: ['username'],
        as: 'owner'
      }
    ]
  })
    .then(product => {
      if (product) {
        // Verificar si el usuario autenticado es el dueño del producto
        const isOwner = product.userId === userId;
        res.render('product', { product, isOwner });
      } else {
        res.status(404).send('Product not found');
      }
    })
    .catch(error => {
      console.error(error);
      res.sendStatus(500);
    });
});

app.get('/product/:id/update', requireAuth, (req, res) => {
  const productId = req.params.id;
  const userId = req.session.userId;

  Product.findByPk(productId)
    .then(product => {
      if (product && product.userId === userId) {
        res.render('edit-product', { product });
      } else {
        res.status(404).send('Product not found');
      }
    })
    .catch(error => {
      console.error(error);
      res.sendStatus(500);
    });
});

// Update Product route
app.post('/product/:id/update', requireAuth, (req, res) => {
  const productId = req.params.id;
  const { name, description, price } = req.body;

  Product.update({ name, description, price }, { where: { id: productId, userId: req.session.userId } })
    .then(() => {
      res.redirect('/products');
    })
    .catch(error => {
      console.error(error);
      res.sendStatus(500);
    });
});

// Delete Product route
app.get('/product/:id/delete', requireAuth, (req, res) => {
  const productId = req.params.id;

  Product.findByPk(productId, { include: ['owner'] })
    .then(product => {
      if (!product) {
        res.status(404).send('Product not found');
      } else if (product.owner.id !== req.session.userId) {
        res.status(403).send('Access denied');
      } else {
        res.render('delete-product', { product });
      }
    })
    .catch(error => {
      console.error(error);
      res.sendStatus(500);
    });
});

// Confirm Delete Product route
app.post('/product/:id/delete', requireAuth, (req, res) => {
  const productId = req.params.id;

  Product.destroy({ where: { id: productId, userId: req.session.userId } })
    .then(() => {
      res.redirect('/products');
    })
    .catch(error => {
      console.error(error);
      res.sendStatus(500);
    });
});

// Edit Product page route
app.get('/product/:id/edit', requireAuth, (req, res) => {
  const productId = req.params.id;
  const userId = req.session.userId;

  Product.findByPk(productId)
    .then(product => {
      if (product && product.userId === userId) {
        res.render('edit-product', { product, message: null });
      } else {
        res.status(404).send('Product not found');
      }
    })
    .catch(error => {
      console.error(error);
      res.sendStatus(500);
    });
});


// Handle 404 Not Found route
app.use((req, res, next) => {
  res.status(404).render('404');
});


// Start the server
sequelize.sync()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(error => {
    console.error('Error connecting to the database: ', error);
  });
