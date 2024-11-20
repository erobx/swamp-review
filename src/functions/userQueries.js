import supabase from "../config/supabaseClient";
import { getTagCountsForAllHousing } from "./tagQueries";
import { computeTagsForHousing } from "../util/tagUtil";
import { getAvgRatingByCategoryForAllHousing } from "./housingQueries";

/**
 * Creates a record for the user in the public.users table
 * @param {Object} user - The object containing the user's data
 * @param {string} user.id - The uuid of the user (contained in auth.users)
 * @param {string} user.email - The email of the user
 * @param {string} user.first_name - The firstname of the user
 * @param {string} user.last_name - The lastname of the user
 * @param {string} user.major - The major of the user
 * @param {string} user.year - The year of the user (reference enum from Supabase)
 */
export const createPublicUser = async (user) => {
	const { error } = await supabase.from("users").insert(user);
	if (error) {
		console.log("Error creating user");
		throw error;
	}
};

/**
 * Retrieve all user favorites
 * @param {string} uuid - User id
 * @returns {any[]} data - Favorite housing
 */

export const getUserFavorites = async (uuid) => {
	let { data, error } = await supabase
		.from("favorites")
		.select(
			`
			housing (
        id,
        name,
        address,
        attributes (
          attribute_name
        ),
        room_types: room_type (
          id,
          name,
          fall_spring_price,
          summer_AB_price,
          summer_C_price
        ),
        reviews (
          content,
          created_at,
          tags (
            id,
            name
          ),
          ratings: reviews_to_categories (
            value: rating_value,
            category: categories (
              id,
              name
            )
          ),
          user: users (
            *
          ),
          roomType: room_type (
            id,
            name
          )
        ),
        interest_points (
          name,
          address,
          lat,
          lng
        )
			)
		`
		)
		.eq("user_id", uuid)
		.gt("housing_id", -1);

	if (error) {
		console.log(`Error retrieving favorites`);
		throw error;
	}

	const avgRatings = await getAvgRatingByCategoryForAllHousing();
	data = data.map((obj) => {
		return obj.housing?.id in avgRatings
			? { ...obj.housing, average_ratings: avgRatings[obj.housing?.id] }
			: { ...obj.housing, average_ratings: [] };
	});

	const tagCounts = await getTagCountsForAllHousing();
	data = data.map((housing) => {
		if (housing?.id in tagCounts)
			return { ...housing, tags: computeTagsForHousing(tagCounts[housing?.id], housing?.reviews?.length) };

		return { ...housing, tags: [] };
	});

	return data;
};

/**
 * Insert a new favorite for a user
 * @param {number} housing_id - Housing selected
 * @param {string} uuid - User id
 */

export const addUserFavorite = async (housing_id, uuid) => {
	const { error } = await supabase.from("favorites").insert({ housing_id, user_id: uuid });
	if (error) {
		console.log("Error creating favorite");
		throw error;
	}
};

/**
 * Remove a favorite for a user
 * @param {number} housing_id - Housing selected
 * @param {string} uuid - User id
 */

export const removeUserFavorite = async (housing_id, uuid) => {
	const { error } = await supabase.from("favorites").delete().eq("housing_id", housing_id).eq("user_id", uuid);
	if (error) {
		console.log("Error deleting favorite");
		throw error;
	}
};

/**
 * Update a user's username
 * @param {string} uuid - User id
 * @param {string} new_username - New username
 */

export const updateUsername = async (uuid, new_username) => {
	// TODO: check if username is unique and valid

	const { error } = await supabase.from("users").update({ username: new_username }).eq("id", uuid);
	if (error) {
		console.log("Error updating username");
		throw error;
	}
};

/**
 * Retrieve user data
 * @param {string} uuid - User id
 * @returns {any[]} data - User data
 */

export const getUser = async (uuid) => {
	const { data, error } = await supabase
		.from("users")
		.select(
			`
			first_name,
			last_name,
			email,
			major,
			year,
			role,
			icon_color,
			theme_ld`
		)
		.eq("id", uuid);
	if (error) {
		console.log(`Error retrieving user data`);
		throw error;
	}
	return data[0];
};

/**
 * Update user data
 * @param {string} uuid - User id
 * @param {Object} updatedUser - User data
 */
export const updateUser = async (uuid, updatedUser) => {
	console.log(updatedUser);
	const { data, error } = await supabase
		.from("users")
		.update({
			...updatedUser,
		})
		.eq("id", uuid)
		.select();
	console.log(data);
	console.log(error);
	if (error) {
		console.log("Error updating user");
		throw error;
	}
	return { data, error };
};

/**
 * Retrieve user data
 * @param {string} uuid - User id
 * @returns {string} data - User role (admin, user, moderator, faculty)
 */
export const getUserRole = async (uuid) => {
	const { data, error } = await supabase
		.from("users")
		.select(
			`
			role`
		)
		.eq("id", uuid);
	if (error) {
		console.log(`Error retrieving user data`);
		throw error;
	}
	return data;
};
