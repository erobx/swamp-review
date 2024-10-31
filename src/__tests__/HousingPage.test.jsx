import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, beforeEach, expect } from "vitest";
import { mockHousingData } from "./data/mockHousingData";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import HousingPage from "../pages/HousingPage";

describe("Housing page tests", () => {
	beforeEach(() => {
		render(
			<MemoryRouter initialEntries={["/housing/-1"]}>
				<Routes>
					<Route path="/housing/:housingId" element={<HousingPage />} />
				</Routes>
			</MemoryRouter>
		);
	});

	it("should render housing name", async () => {
		await waitFor(() => {
			expect(screen.getByText(mockHousingData.name)).toBeInTheDocument();
		});
	});

	it("should render all average ratings", async () => {
		await waitFor(() => {
			mockHousingData.average_ratings.forEach((rating) => {
				const category = screen.getByText(rating.category.name);
				expect(category).toBeInTheDocument();

				const value = screen.getByText(rating.value.toFixed(1));
				expect(value).toBeInTheDocument();
			});
		});
	});

	it("should render all room types", async () => {
		const testPrice = async (roomTypeObj, priceInfo) => {
			// Find and click button for appropraite price type (fall/spring, summer a/b, or summer c)
			const button = screen.getByText(priceInfo.buttonText).previousElementSibling;
			await userEvent.click(button);

			// Test room type is displayed
			const roomName = screen.getByText(roomTypeObj.name);
			expect(roomName).toBeInTheDocument();

			// Test price is displayed
			const price = screen.getByText(
				new Intl.NumberFormat("en-US", {
					style: "currency",
					currency: "USD",
					minimumFractionDigits: 0,
					maximumFractionDigits: 0,
				}).format(roomTypeObj[priceInfo.name])
			);
			expect(price).toBeInTheDocument();
		};

		await waitFor(async () => {
			const priceInfo = [
				{ name: "summer_C_price", buttonText: "Summer C" },
				{ name: "fall_spring_price", buttonText: "Fall/Spring" },
				{ name: "summer_AB_price", buttonText: "Summer A/B" },
			];

			// Test Room Type 1
			await testPrice(mockHousingData.room_types[0], priceInfo[0]);
			await testPrice(mockHousingData.room_types[0], priceInfo[1]);
			await testPrice(mockHousingData.room_types[0], priceInfo[2]);

			// Test Room Type 2
			await testPrice(mockHousingData.room_types[1], priceInfo[0]);
			await testPrice(mockHousingData.room_types[1], priceInfo[1]);
			await testPrice(mockHousingData.room_types[1], priceInfo[2]);
		});
	});

	it("should render all attributes", async () => {
		await waitFor(() => {
			mockHousingData.attributes.forEach((attribute) => {
				expect(screen.getByText(attribute.attribute_name)).toBeInTheDocument();
			});
		});
	});

	// Just check that the review appears, details of the review component are tested elsewhere
	it("should render all reviews", async () => {
		await waitFor(() => {
			mockHousingData.reviews.forEach((review) => {
				expect(screen.getByText(review.content)).toBeInTheDocument();
			});
		});
	});
});