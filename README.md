# Inventory
El proyecto es una aplicación web que permite gestionar un inventario de productos. Está
desarrollado utilizando Node.js y Express como framework de backend, y utiliza SQLite como base
de datos. Para interactuar con la base de datos, se utiliza Sequelize, una biblioteca de ORM.
Sequelize proporciona una capa de abstracción de base de datos, lo que significa que en lugar de
escribir consultas SQL en bruto, podemos definir modelos que representan las tablas de la base de
datos y realizar operaciones CRUD utilizando métodos y propiedades de objetos.
En el proyecto, tenemos dos modelos principales: User y Product. Estos modelos están definidos en
Sequelize y tienen propiedades como username, password, email, name, description y price.
Además, establecemos una relación entre los modelos, donde un usuario puede tener muchos
productos (User.hasMany(Product)) y un producto pertenece a un usuario
(Product.belongsTo(User)).
Cuando un usuario accede a la aplicación, puede registrarse o iniciar sesión. Al registrarse, se
verifica que el nombre de usuario y el correo electrónico no estén registrados previamente en la
base de datos. La contraseña se almacena de forma segura utilizando la función de hashing de
bcrypt.
Una vez que un usuario inicia sesión, se guarda su ID de usuario en la sesión para mantener la
autenticación en las diferentes rutas de la aplicación. En la página principal, se verifica si el usuario
está autenticado y se redirige a la página de productos si está registrado, de lo contrario, se redirige
a la página de inicio de sesión.
En la página de productos, se muestra una lista de productos con la opción de buscar por nombre.
Los productos se obtienen de la base de datos utilizando Sequelize, y también se incluye el nombre
de usuario del propietario de cada producto. Además, hay una opción de búsqueda avanzada que
permite buscar productos mientras el usuario esté autenticado.
Los usuarios autenticados también tienen acceso a una página donde pueden ver y administrar sus
propios productos. Pueden crear nuevos productos, editar los existentes y eliminarlos. Se verifican
los permisos del usuario para asegurarse de que solo puedan realizar operaciones en sus propios
productos.
Adjunto el modelo que he realizado con Sequelize, tengo otro modelo realizado con la biblioteca
sqlite3 pero tiene severas desventajas que me han hecho decidirme por este. Sequelize proporciona
una capa de abstracción de base de datos que simplifica la interacción con la base de datos. En lugar
de tener que escribir consultas SQL en bruto, Sequelize permite realizar operaciones CRUD y
definir modelos. Luego a la hora de definir relaciones entre modelos Sequelize me ha permitido
utilizar hasMany o belongsTo para establecer relaciones entre ‘User’ y ‘Product’, lo cual simplifica
la forma en la que se accede y se consulta la información.Además de la funcionalidad básica descrita anteriormente, se ha agregado una nueva característica al
proyecto de inventario. La nueva funcionalidad permite a los usuarios generar un informe detallado de los
productos existentes en el inventario.
Al acceder a la página principal de la aplicación, los usuarios autenticados verán un nuevo botón llamado
"Generar informe" en el menú principal. Al hacer clic en este botón, se desencadena una acción que genera
un informe en formato CSV que contiene todos los detalles de los productos en el inventario.
Para implementar esta funcionalidad, se ha añadido una nueva ruta en el servidor utilizando Express. La
ruta se define como app.get('/download', ...). Cuando un usuario hace clic en el botón "Generar informe",
se realiza una solicitud HTTP GET a esta ruta.
