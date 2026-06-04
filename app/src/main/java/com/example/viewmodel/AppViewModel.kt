package com.example.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.model.*
import com.example.ui.theme.*
import com.example.R
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class AppViewModel : ViewModel() {

    // Age Verification and Screen Navigation States
    private val _currentScreen = MutableStateFlow<Screen>(Screen.Splash)
    val currentScreen: StateFlow<Screen> = _currentScreen.asStateFlow()

    private val _isAgeVerified = MutableStateFlow(false)
    val isAgeVerified: StateFlow<Boolean> = _isAgeVerified.asStateFlow()

    private val _activeTab = MutableStateFlow(DashboardTab.HOME)
    val activeTab: StateFlow<DashboardTab> = _activeTab.asStateFlow()

    // Mock Product Catalog modeled on high-end vape devices
    val products = listOf(
        VapeProduct(
            id = "dc_jordan_80k",
            name = "DEEP CLOUD JORDAN",
            modelTag = "PRO GRADE — 80,000 PUFFS",
            description = "Intricate custom gold Arabic calligraphy engraved on matte-black carbon, featuring a dynamic rainbow RGB LED status ring. Equipped with dual pre-heating mesh coils, customizable vapor density modes, and organic Japanese cotton for maximum flavor richness.",
            price = 45.0,
            rating = 4.9,
            reviewsCount = 412,
            puffs = "80,000",
            eLiquid = "50ML",
            nicotine = "6MG/ML",
            flavors = listOf(
                FlavorOption("Royal Mint", NeonMint, "Ice cold sweet double mint burst"),
                FlavorOption("Imperial Berry", NeonStrawberry, "Juicy hand-picked forest strawberries with sour cloud"),
                FlavorOption("Golden Mango", NeonMango, "Rich, tropical tree-ripened honey mango"),
                FlavorOption("Vintage Blueberry", NeonBlueberry, "Wild sweet mountain blueberry with heavy vapor texture")
            ),
            defaultFlavor = FlavorOption("Royal Mint", NeonMint, "Ice cold sweet double mint burst"),
            imageResId = R.drawable.img_vape_device,
            dualMode = true,
            rgbLighting = true
        ),
        VapeProduct(
            id = "dc_neo_60k",
            name = "DEEP CLOUD NEO",
            modelTag = "RGB SIGNATURE — 60,000 PUFFS",
            description = "Elegantly finished with vertical glowing acrylic visual bands that strobe in neon hues with each draw. Features standard single DTL mesh, variable juice monitoring indicators, and a solid titanium frame.",
            price = 35.0,
            rating = 4.8,
            reviewsCount = 289,
            puffs = "60,000",
            eLiquid = "40ML",
            nicotine = "3MG/ML",
            flavors = listOf(
                FlavorOption("Ice Grape", NeonPurple, "Succulent frosted red and black grapes"),
                FlavorOption("Classic Peach", NeonMango, "Fuzzy warm peach with rich sweetness"),
                FlavorOption("Mint Chill", NeonMint, "Crushed spearmint standard menthol")
            ),
            defaultFlavor = FlavorOption("Ice Grape", NeonPurple, "Succulent frosted red and black grapes"),
            imageResId = R.drawable.img_vape_device, // Resuable vector or image
            dualMode = false,
            rgbLighting = true
        ),
        VapeProduct(
            id = "dc_pro_40k",
            name = "DEEP CLOUD COMPACT",
            modelTag = "MINIMALIST — 40,000 PUFFS",
            description = "A sleek, pocket-friendly luxury piece encased in a lightweight aluminum-bronze armor with high contrast golden trim. Highly discreet airflow slider engineered specifically for smooth mouth-to-lung draws.",
            price = 25.0,
            rating = 4.7,
            reviewsCount = 196,
            puffs = "40,000",
            eLiquid = "25ML",
            nicotine = "12MG/ML",
            flavors = listOf(
                FlavorOption("Tobacco Gold", GoldPrimary, "Roasted virginia tobacco infused with premium caramel honey"),
                FlavorOption("Double Mint", NeonMint, "Crushed spearmint standard menthol"),
                FlavorOption("Sour Apple", NeonStrawberry, "Tart crisp granny smith green apple")
            ),
            defaultFlavor = FlavorOption("Tobacco Gold", GoldPrimary, "Roasted virginia tobacco infused with premium caramel honey"),
            imageResId = R.drawable.img_vape_device,
            dualMode = false,
            rgbLighting = false
        )
    )

    // Shopping Cart State
    private val _cart = MutableStateFlow<List<CartItem>>(emptyList())
    val cart: StateFlow<List<CartItem>> = _cart.asStateFlow()

    val totalCartPrice = _cart.map { list ->
        list.sumOf { it.product.price * it.quantity }
    }

    // Orders History State
    private val _ordersList = MutableStateFlow<List<Order>>(emptyList())
    val ordersList: StateFlow<List<Order>> = _ordersList.asStateFlow()

    // User Profile State
    private val _userProfile = MutableStateFlow(UserProfile())
    val userProfile: StateFlow<UserProfile> = _userProfile.asStateFlow()

    // Splash animation initialization
    init {
        viewModelScope.launch {
            delay(1800) // Beautiful cinematic splash delay
            if (_isAgeVerified.value) {
                _currentScreen.value = Screen.MainDashboard
            } else {
                _currentScreen.value = Screen.AgeVerification
            }
        }
    }

    // Age Verification events
    fun verifyAge(isVerified: Boolean) {
        if (isVerified) {
            _isAgeVerified.value = true
            _currentScreen.value = Screen.MainDashboard
        } else {
            // Unverified exit: handled in visual UI overlay or close app
            _isAgeVerified.value = false
        }
    }

    // Navigation events
    fun navigateTo(screen: Screen) {
        _currentScreen.value = screen
    }

    fun navigateBack() {
        val current = _currentScreen.value
        when (current) {
            is Screen.ProductDetails -> _currentScreen.value = Screen.MainDashboard
            is Screen.Cart -> _currentScreen.value = Screen.MainDashboard
            is Screen.Checkout -> _currentScreen.value = Screen.Cart
            is Screen.OrderTracking -> {
                // Return to user's orders tab
                _activeTab.value = DashboardTab.ORDERS
                _currentScreen.value = Screen.MainDashboard
            }
            else -> _currentScreen.value = Screen.MainDashboard
        }
    }

    fun selectTab(tab: DashboardTab) {
        _activeTab.value = tab
    }

    // Cart Actions
    fun addToCart(product: VapeProduct, flavor: FlavorOption, quantity: Int) {
        val currentList = _cart.value.toMutableList()
        val index = currentList.indexOfFirst {
            it.product.id == product.id && it.selectedFlavor.name == flavor.name
        }
        if (index != -1) {
            // Already in cart, update quantity
            val item = currentList[index]
            currentList[index] = item.copy(quantity = item.quantity + quantity)
        } else {
            // Add new cart entry
            currentList.add(CartItem(product, flavor, quantity))
        }
        _cart.value = currentList
    }

    fun updateCartQuantity(product: VapeProduct, flavor: FlavorOption, delta: Int) {
        val currentList = _cart.value.toMutableList()
        val index = currentList.indexOfFirst {
            it.product.id == product.id && it.selectedFlavor.name == flavor.name
        }
        if (index != -1) {
            val item = currentList[index]
            val newQuantity = item.quantity + delta
            if (newQuantity <= 0) {
                currentList.removeAt(index)
            } else {
                currentList[index] = item.copy(quantity = newQuantity)
            }
            _cart.value = currentList
        }
    }

    fun removeCartItem(product: VapeProduct, flavor: FlavorOption) {
        val currentList = _cart.value.toMutableList()
        currentList.removeAll {
            it.product.id == product.id && it.selectedFlavor.name == flavor.name
        }
        _cart.value = currentList
    }

    // Order Placement & Tracking Simulation
    fun placeOrder(fullName: String, phoneNumber: String, address: String, paymentMethod: String) {
        viewModelScope.launch {
            val currentItems = _cart.value
            if (currentItems.isEmpty()) return@launch

            val orderId = "DC-${(100000..999999).random()}"
            val sdf = SimpleDateFormat("hh:mm a", Locale.getDefault())
            val timeString = sdf.format(Date())

            val history = mutableMapOf<TrackingStatus, String>().apply {
                put(TrackingStatus.ORDER_PLACED, timeString)
            }

            val newOrder = Order(
                id = orderId,
                items = currentItems,
                totalPrice = currentItems.sumOf { it.product.price * it.quantity } + 5.0, // $5 shipping
                fullName = fullName,
                phoneNumber = phoneNumber,
                deliveryAddress = address,
                paymentMethod = paymentMethod,
                timestamp = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault()).format(Date()),
                status = TrackingStatus.ORDER_PLACED,
                statusHistory = history
            )

            // Append to orders
            _ordersList.value = listOf(newOrder) + _ordersList.value
            // Clear cart
            _cart.value = emptyList()
            // Navigate to tracking
            _currentScreen.value = Screen.OrderTracking(orderId)

            // Start Simulated Tracking Updates Coroutine
            simulateOrderTransitions(orderId)
        }
    }

    private fun simulateOrderTransitions(orderId: String) {
        viewModelScope.launch {
            // Transition Statuses over time for realism in emulator!
            val statuses = listOf(
                TrackingStatus.PREPARING,
                TrackingStatus.OUT_FOR_DELIVERY,
                TrackingStatus.DELIVERED
            )

            for (nextStatus in statuses) {
                delay(30000) // Delay 30 seconds for state transition
                val currentOrders = _ordersList.value.toMutableList()
                val idx = currentOrders.indexOfFirst { it.id == orderId }
                if (idx != -1) {
                    val order = currentOrders[idx]
                    val sdf = SimpleDateFormat("hh:mm a", Locale.getDefault())
                    val timeString = sdf.format(Date())
                    val updatedHistory = order.statusHistory.toMutableMap().apply {
                        this[nextStatus] = timeString
                    }
                    currentOrders[idx] = order.copy(
                        status = nextStatus,
                        statusHistory = updatedHistory
                    )
                    _ordersList.value = currentOrders
                } else {
                    break
                }
            }
        }
    }

    fun logout() {
        // Clear all state to demonstrate pristine reset
        _isAgeVerified.value = false
        _cart.value = emptyList()
        _ordersList.value = emptyList()
        _currentScreen.value = Screen.AgeVerification
    }
}
