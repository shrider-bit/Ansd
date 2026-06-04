package com.example.model

import androidx.compose.ui.graphics.Color
import com.example.ui.theme.*

// Data class representing a customizable flavor option
data class FlavorOption(
    val name: String,
    val hexColor: Color,
    val description: String
)

// Data class for Deep Cloud Vape Products
data class VapeProduct(
    val id: String,
    val name: String,
    val modelTag: String,
    val description: String,
    val price: Double,
    val rating: Double,
    val reviewsCount: Int,
    val puffs: String,
    val eLiquid: String,
    val nicotine: String,
    val flavors: List<FlavorOption>,
    val defaultFlavor: FlavorOption,
    val imageResId: Int,
    val dualMode: Boolean = true,
    val rgbLighting: Boolean = true
)

// Data class representing an item added to the shopping cart
data class CartItem(
    val product: VapeProduct,
    val selectedFlavor: FlavorOption,
    val quantity: Int
)

// Enum representing the active screen
sealed interface Screen {
    object Splash : Screen
    object AgeVerification : Screen
    object MainDashboard : Screen
    data class ProductDetails(val product: VapeProduct) : Screen
    object Cart : Screen
    object Checkout : Screen
    data class OrderTracking(val orderId: String) : Screen
}

// Current tab inside the main dashboard view
enum class DashboardTab {
    HOME, SHOP, ORDERS, PROFILE
}

// Tracking states for vape order delivery
enum class TrackingStatus {
    ORDER_PLACED,
    PREPARING,
    OUT_FOR_DELIVERY,
    DELIVERED
}

// Data class for placed Orders
data class Order(
    val id: String,
    val items: List<CartItem>,
    val totalPrice: Double,
    val fullName: String,
    val phoneNumber: String,
    val deliveryAddress: String,
    val paymentMethod: String,
    val timestamp: String,
    val status: TrackingStatus = TrackingStatus.ORDER_PLACED,
    val statusHistory: Map<TrackingStatus, String> // Status to Time string
)

// User profile representation
data class UserProfile(
    val name: String = "Samer Al-Jordan",
    val phone: String = "+962 79 123 4567",
    val avatarUrl: String = "",
    val loyaltyPoints: Int = 850
)
