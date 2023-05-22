const { deleteImgCloudinary } = require("../../middleware/files.middleware");
const Character = require("../models/Character.model");
const Movie = require("../models/Movies.model");

//! ---------------------------------------------------------------------
//? -------------------------------POST ---------------------------------
//! ---------------------------------------------------------------------

const create = async (req, res, next) => {
  //! capturo la url para si luego la tengo que borrar y le pongo el optional chaining (?) para que no me rompa en caso que no tenga la clave path
  let catchImg = req.file?.path;
  try {
    //! ------ actualizamos los indexes---------------
    await Character.syncIndexes();

    // creamos este objeto porque no queremos incluir el array de las peliculas para que no nos rompa
    const filterBody = {
      name: req.body.name,
      gender: req.body.gender,
    };
    //! ------ cremos un nuevo modelo con los datos que nos trae la request body-------
    const newCharacter = new Character(filterBody);

    // cogemos las movies del req.body y las recorremos
    const { movie } = req.body;

    // con el spli creamos un array
    const arrayMovie = movie.split(",");

    // lo recorremos y le puseamos cada id de las movies al new character que creamos del modelo
    arrayMovie.forEach((item) => {
      newCharacter.movie.push(item);
    });

    //!------- si nos envia imagen metemos la que nos dan sino metemos una foto general
    if (req.file) {
      newCharacter.image = req.file.path;
    } else {
      newCharacter.image = "https://pic.onlinewebfonts.com/svg/img_181369.png";
    }

    // lo guardamos en la db
    const saveCharacter = await newCharacter.save();

    // evaluamos que se haya efectuado correctamente
    if (saveCharacter) {
      // si es un si: envio un 200 y un json con el objeto postedo
      // recorremos antes el array de los id que recibimos por el req.body
       arrayMovie.forEach(async (itemID) => {
        const movieById = await Movie.findById(itemID);

        // actualizamos las movie para incluir el id del character 
        await movieById.updateOne({
          $push: { characters: saveCharacter._id },
        });
        })
        // os hago un test mas sencillo, primero busco cuantas movies incluyen el id del character 
        // luego en la respuesta comparo su logitud con el array de los id de las movies si son iguales todo ok sino moovie no actualzadas correctamente
      const testMovie =  await Movie.find({characters: saveCharacter._id})
      return res.status(200).json({
        newCharacter: saveCharacter,
        movieUpdate: testMovie.length == arrayMovie.length ? "movie update ok" : "no ok movie update"
      });
    } else {
      // si es un no: envio un 404 not found, de que no se ha enviado en elemento a la base de datos
      return res.status(404).json("No se ha podido subir el Character");
    }
  } catch (error) {
    // lanzo por el next el error a nivel general de try cach para tener constancia en el log de este error
    deleteImgCloudinary(catchImg);

    return next(error);
  }
};

//! ---------------------------------------------------------------------
//? ------------------------------GETALL --------------------------------
//! ---------------------------------------------------------------------
const getAll = async (req, res, next) => {
  try {
    // ES EL FIND DE LA QUERY DE MONGOOSE NOS TRAE TODOS LOS ELEMENTOS
    const allCharacter = await Character.find().populate("movie");
    if (allCharacter) {
      return res.status(200).json(allCharacter);
    } else {
      return res.status(404).json("Not found all character");
    }
  } catch (error) {
    return next(error);
  }
};

//! ---------------------------------------------------------------------
//? ------------------------------GETBYID -------------------------------
//! ---------------------------------------------------------------------
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const characterById = await Character.findById(id).populate("movie");
    if (characterById) {
      return res.status(200).json(characterById);
    } else {
      return res.status(404).json("Not found Character by ID");
    }
  } catch (error) {
    return next(error);
  }
};

//! ---------------------------------------------------------------------
//? ----------------------------- GET BY NAME ---------------------------
//! ---------------------------------------------------------------------

const getByName = async (req, res, next) => {
  try {
    const { name } = req.params;
    const characterByName = await Character.find({ name });
    if (characterByName) {
      return res.status(200).json(characterByName);
    } else {
      return res.status(404).json("Not found Character by name");
    }
  } catch (error) {
    return next(error);
  }
};

//! ---------------------------------------------------------------------
//? ----------------------------- UPDATE --------------------------------
//! ---------------------------------------------------------------------

const updateCharacter = async (req, res, next) => {
  //! capturo la url para si luego la tengo que borrar y le pongo el optional chaining (?) para que no me rompa en caso que no tenga la clave path
  let catchImg = req.file?.path;
  try {
    const { id } = req.params;

    /// vamos a buscar que exista este character en la baase de datos
    const characterById = await Character.findById(id);

    /// guardamos la url de la imagen antigua
    const oldImg = characterById.image;

    //! SI EXISTE ESTE CHARACTER ENTONCES ME HACES LA LOGICA DEL UPDATE
    if (characterById) {
      // Me ijnstancio un nuevo objeto del modelo Character
      const patchCharacter = new Character(req.body);

      //! IMPORTANTE --> METER EL ID ANTIGUO PARA QUE NO CAMBIE
      patchCharacter._id = id;

      // si he recibido un archivo se lo meto en la clave image
      if (req.file) {
        patchCharacter.image = req.file.path;
      } else {
        // si no lo recibo me quedo con el antiguo
        patchCharacter.image = oldImg;
      }

      // HACEMOS LA QUERY DE MONGOOSE DE ENCONTRAR POR ID Y ACTUALIZAR
      const saveCharacter = await Character.findByIdAndUpdate(
        id,
        patchCharacter
      );
      // EVALUAMOS SI ESTA SE HA REALIZADO CORRECTAMENTE
      if (saveCharacter) {
        // si se ha actualizado ----> borro la foto antigua de cloudinary
        // envio la respuesta con un 200
        deleteImgCloudinary(oldImg);
        return res.status(200).json(await Character.findById(id));
      } else {
        // si no se ha actualizado entonces mando una respuesta con un 404 diciendo que no se ha actualizado
        return res.status(404).json("Dont save character");
      }

      //! SI NO EXISTE ME LANZAS UN ERROR AL USUARIO POR LA RESPUESTA
    } else {
      // si no he encontrado por id---> mando una respuesta 404 que no se ha encontrado
      return res.status(404).json("Not Found character by id");
    }
  } catch (error) {
    //! IMPORTANTE--> si el character no se encontro o hay cualquier otro error capturado la foto se ha subido antes porque esta en el middleware
    //! por lo cual hay borrarla para no tener basura dentro de nuestro cloudinary
    if (req.file) {
      //! le pasamos el req.file.path que incluye la url de cloudinary
      deleteImgCloudinary(catchImg);
    }

    // por ultimo lanzamos el errror que se guardara en el log del backend
    return next(error);
  }
};

//! ---------------------------------------------------------------------
//? ----------------------------- DELETE --------------------------------
//! ---------------------------------------------------------------------

const deleteCharacter = async (req, res, next) => {
  try {
    // nos traemos el id de los params
    const { id } = req.params;

    // buscamos por id y borramos
    const deleteCharacter = await Character.findByIdAndDelete(id);

    // esto anterior nos devuelve siempre el elemento buscado pero puede ser que no haya borrado por eso cuidado
    if (deleteCharacter) {
      // para ver que esto esta correctamente borrado lo busco en la db, si no esta elimino la imagen y si esta lanzo un next para acaba con la ejecucion
      if (await Character.findById(id)) {
        next("Error en el borrado de la imagen");
      } else {
        deleteImgCloudinary(deleteCharacter.image);

        // tengo que actualizar las movies que incluyan el id del character en el array de characters
        await Movie.updateMany(
          { characters: id },
          {
            $pull: { characters: id },
          }
        );
      }

      // si todo se ha hecho correctamente lanzamos un 200, no obstante tambien test en el runtime que se haya hecho correctamente con la clave test
      return res.status(200).json({
        deleteObject: deleteCharacter,
        test: (await Character.findById(id)) ? "no ok delete" : "ok delete",
      });
    } else {
      return res.status(404).json("Not found character error delete");
    }
  } catch (error) {
    return next(error);
  }
};
module.exports = {
  create,
  getAll,
  getById,
  getByName,
  updateCharacter,
  deleteCharacter,
};

//! -------COMO CREAR UN DATO DE TYPO OBJECT ID --------------------
// arrayMovie.forEach((item) => {
//   console.log(item);
//   const idObject = new ObjectId(item);
//   newCharacter.movie.push(idObject);
// });

// const mongoose = require("mongoose").ObjectId;
// const ObjectId = require("mongodb").ObjectId;
// cont newObjectId = new mongoose("646617810d39f978d28159fb")
