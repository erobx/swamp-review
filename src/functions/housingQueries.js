import supabase from "../config/supabaseClient";
import { computeTagsForHousing } from "../util/tagUtil";
import { getTagCountsForAllHousing, getTagCountsForHousing } from "./tagQueries";

export const getAllHousing = async () => {
	let { data, error } = await supabase
		.from("housing")
		.select(
			`
    id,
    name,
    address,
    lat,
    lng,
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
      ),
      flags: flagged_reviews (
        *
      )
    ),
    interest_points (
      name,
      address,
      lat,
      lng
    )
  `
		)
		.gt("id", -1)
		.eq("reviews.status", "approved");
	if (error) {
		console.log("Error retrieving housing");
		throw error;
	}

	// Get average ratings
	const avgRatings = await getAvgRatingByCategoryForAllHousing();
	data = data.map((housing) => {
		return housing.id in avgRatings
			? { ...housing, average_ratings: avgRatings[housing.id] }
			: { ...housing, average_ratings: [] };
	});

	// Compute tag counts
	const tagCounts = await getTagCountsForAllHousing();
	data = data.map((housing) => {
		if (housing.id in tagCounts)
			return { ...housing, tags: computeTagsForHousing(tagCounts[housing.id], housing.reviews.length) };

		return { ...housing, tags: [] };
	});

	// Sort the categories so they are displayed consistently
	data = data.map((housing) => {
		housing.average_ratings = housing.average_ratings.sort((a, b) => a.category.id - b.category.id);
		housing.reviews = housing.reviews.map((review) => {
			review.ratings = review.ratings.sort((a, b) => a.category.id - b.category.id);
			return review;
		});
		return housing;
	});

	return data;
};

export const getHousing = async (id) => {
	const { data, error } = await supabase
		.from("housing")
		.select(
			`
    name,
    address,
    lat,
    lng,
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
      review_id: id,
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
      ),
      flags: flagged_reviews (
        *
      )
    ),
    interest_points (
      name,
      address,
      lat,
      lng
    )
  `
		)
		.eq("id", id)
		.eq("reviews.status", "approved");
	if (error) {
		console.log(`Error retrieving housing ${id}`);
		throw error;
	}

	// Capture housing from returned data
	let housing = data[0];

	// Get average ratings
	const average_ratings = await getAvgRatingByCategoryForHousing(id);
	housing = { ...housing, average_ratings };

	// Compute tag counts
	const tagCounts = await getTagCountsForHousing(id);
	const appliedTags = computeTagsForHousing(tagCounts, housing.reviews.length);
	housing = { ...housing, tags: appliedTags };

	// Sort the categories so they are displayed consistently
	housing.average_ratings = housing.average_ratings.sort((a, b) => a.category.id - b.category.id);
	housing.reviews = housing.reviews.map((review) => {
		review.ratings = review.ratings.sort((a, b) => a.category.id - b.category.id);
		return review;
	});

	return housing;
};

export const getInterestPoints = async (id) => {
	const { data, error } = await supabase
		.from("housing")
		.select(
			`
    interest_points (
      id,
      name,
      address,
      lat,
      lng
    )
  `
		)
		.eq("id", id);
	if (error) {
		console.log("Error retrieving interest points");
		throw error;
	}
	return data;
};

export const getHousingReviews = async (id) => {
	const { data, error } = await supabase
		.from("housing")
		.select(
			`
    id,
    name,
    address,
    reviews (
      rating,
      content,
      created_at,
      tags (
        name
      )
    )
  `
		)
		.eq("id", id);
	if (error) {
		console.log(`Error retrieving reviews for housing ${id}`);
		throw error;
	}
	return data;
};

export const getAvgRatingByCategoryForAllHousing = async () => {
	const { data, error } = await supabase.rpc("get_avg_ratings_for_all_housing");

	if (error) {
		console.error("Error fetching data:", error);
		return null;
	}

	const groupedAverageRatings = {};
	data.forEach((ar) => {
		const { housing_id, ...rest } = ar;
		if (!(housing_id in groupedAverageRatings)) groupedAverageRatings[housing_id] = [];
		groupedAverageRatings[housing_id].push(rest);
	});

	return groupedAverageRatings;
};

export const getAvgRatingByCategoryForHousing = async (id) => {
	const { data, error } = await supabase.rpc("get_avg_ratings_for_single_housing", { target_housing_id: id });

	if (error) {
		console.error("Error fetching data:", error);
		return null;
	}

	return data;
};
