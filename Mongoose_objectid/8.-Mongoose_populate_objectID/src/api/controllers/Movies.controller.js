const Character = require("../models/Character.model");
const Movie = require("../models/Movies.model");

//! ---------------------------------------------------------------------
//? -------------------------------POST ---------------------------------
//! ---------------------------------------------------------------------

const create = async (req, res, next) => {
  try {
    const newMovie = new Movie(req.body);
    const saveMovie = await newMovie.save();
    if (saveMovie) {
      return res.status(200).json(saveMovie);
    } else {
      return res.status(404).json("Failed create movie");
    }
  } catch (error) {
    return next(error);
  }
};

//! ---------------------------------------------------------------------
//? ------------------------------GETALL --------------------------------
//! ---------------------------------------------------------------------
const getAll = async (req, res, next) => {
  try {
    const allMovies = await Movie.find().populate("characters");
    if (allMovies) {
      return res.status(200).json(allMovies);
    } else {
      return res.status(404).json("Not found, Failed all movie controller");
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
    const movieById = await Movie.findById(id).populate("characters");
    if (movieById) {
      return res.status(200).json(movieById);
    } else {
      return res.status(404).json("Not found movie by id");
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
    const movieByName = await Movie.find({ name });
    if (movieByName) {
      return res.status(200).json(movieByName);
    } else {
      return res.status(404).json("Not found movie by name");
    }
  } catch (error) {
    return next(error);
  }
};

//! ---------------------------------------------------------------------
//? ----------------------------- UPDATE --------------------------------
//! ---------------------------------------------------------------------

const updateMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateMovie = await Movie.findByIdAndUpdate(id, req.body);
    if (updateMovie) {
      return res.status(200).json({
        oldMovie: updateMovie,
        newMovie: await Movie.findById(id),
      });
    } else {
      return res.status(404).json("Not found movie, not update movie");
    }
  } catch (error) {
    return next(error);
  }
};

//! ---------------------------------------------------------------------
//? ----------------------------- DELETE --------------------------------
//! ---------------------------------------------------------------------

const deleteMovie = async (req, res, next) => {
  try {
    // nos traemos el id de los params
    const { id } = req.params;
    const deleteMovie = await Movie.findByIdAndDelete(id);

    // esto anterior nos devuelve siempre el elemento buscado pero puede ser que no haya borrado por eso cuidado
    if (deleteMovie) {

      /// tengo que actualizar todos los modelos de Character que incluyan en su array movie el id de la movie borrada
      await Character.updateMany({ movie: id }, { $pull: { movie: id } });
      const testCharacter = await Character.find({ movie: id });

      // hago dos ttest uno para ver si se ha borrado correctamente y otro para comprobar que se actualizado los character
      return res.status(200).json({
        deleteMovie: deleteMovie,
        testDeleteMovie: (await Movie.findById(id)) ? "delete no ok" : "delete ok",
        testCharacter:
          testCharacter.length > 0
            ? "error update characters"
            : "ok update characters",
      });
    } else {
      return res.status(404).json("Not found movie error delete");
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
  updateMovie,
  deleteMovie,
};
