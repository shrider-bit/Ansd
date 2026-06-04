package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.model.*
import com.example.ui.components.*
import com.example.ui.theme.*
import com.example.viewmodel.AppViewModel

@Composable
fun ApplicationNavHost(viewModel: AppViewModel) {
    val currentScreen by viewModel.currentScreen.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(PureBlack)
    ) {
        // Universal cinematic smoke backdrop drifting subtly behind
        SmokeAnimatedCanvas()

        AnimatedContent(
            targetState = currentScreen,
            transitionSpec = {
                fadeIn(animationSpec = tween(400)) togetherWith fadeOut(animationSpec = tween(400))
            },
            label = "screen_nav"
        ) { state ->
            when (state) {
                is Screen.Splash -> SplashScreen()
                is Screen.AgeVerification -> AgeVerificationScreen(viewModel)
                is Screen.MainDashboard -> MainDashboardScreen(viewModel)
                is Screen.ProductDetails -> ProductDetailsScreen(viewModel, state.product)
                is Screen.Cart -> CartScreen(viewModel)
                is Screen.Checkout -> CheckoutScreen(viewModel)
                is Screen.OrderTracking -> OrderTrackingScreen(viewModel, state.orderId)
            }
        }
    }
}

// 1. Splash Screen
@Composable
fun SplashScreen() {
    val infiniteTransition = rememberInfiniteTransition(label = "logo_glow")
    val glowScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .testTag("splash_screen"),
        contentAlignment = Alignment.Center
    ) {
        // Elegant image-background matching prompt smoke requirements
        Image(
            painter = painterResource(id = R.drawable.img_splash_bg),
            contentDescription = "Deep Cloud Splash Theme",
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )

        // Overlay vignette to maximize contrast
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            PureBlack.copy(alpha = 0.7f),
                            PureBlack.copy(alpha = 0.3f),
                            PureBlack.copy(alpha = 0.95f)
                        )
                    )
                )
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(24.dp)
        ) {
            // Elegant glowing gold cloud brand element
            Box(
                modifier = Modifier
                    .size(140.dp)
                    .drawBehind {
                        drawCircle(
                            brush = Brush.radialGradient(
                                colors = listOf(GoldHighlight.copy(alpha = 0.25f), Color.Transparent),
                                center = center,
                                radius = size.width * glowScale
                            )
                        )
                    },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Cloud,
                    contentDescription = "Deep Cloud Vape Logo Logo",
                    tint = GoldHighlight,
                    modifier = Modifier.size(90.dp)
                )
                Icon(
                    imageVector = Icons.Outlined.KeyboardDoubleArrowUp,
                    contentDescription = "Hookah rising emblem",
                    tint = PureBlack,
                    modifier = Modifier
                        .size(36.dp)
                        .offset(y = 4.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "D E E P   C L O U D",
                color = Color.White,
                style = MaterialTheme.typography.displayMedium,
                fontWeight = FontWeight.Black,
                letterSpacing = 4.sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "PREMIUM VAPE EXPERIENCE",
                color = GoldPrimary,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Subdued Arabic equivalent as requested
            Text(
                text = "ديب كلاود فيب — الفخامة المطلقة",
                color = TextGraySecondary,
                fontSize = 14.sp,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center
            )
        }
    }
}

// 2. Age Verification Screen
@Composable
fun AgeVerificationScreen(viewModel: AppViewModel) {
    var hasRejected by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .testTag("age_verification_screen"),
        contentAlignment = Alignment.Center
    ) {
        Image(
            painter = painterResource(id = R.drawable.img_splash_bg),
            contentDescription = "Splash verified image",
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(PureBlack.copy(alpha = 0.85f))
        )

        Column(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            LuxuryGlowingBorderCard(
                glowColor = NeonStrawberry,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .background(NeonRed.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.WarningAmber,
                            contentDescription = "Minor restriction warnings",
                            tint = NeonRed,
                            modifier = Modifier.size(36.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "AGE RESTRICTION",
                        color = Color.White,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 1.5.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "You must be 18 years of age or older to enter or buy products on DEEP CLOUD. Vape products contain nicotine which is highly addictive.",
                        color = TextGraySecondary,
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                        lineHeight = 20.sp
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "يجب أن يكون عمرك 18 عامًا أو أكثر للدخول. تحذير: يحتوي هذا المنتج على النيكوتين المسبب للإدمان.",
                        color = TextGrayMuted,
                        fontSize = 12.sp,
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                        lineHeight = 18.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            if (!hasRejected) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // YES Button - Gold Gradient
                    LuxuryGradientButton(
                        text = "YES (18+)",
                        onClick = { viewModel.verifyAge(true) },
                        modifier = Modifier.weight(1f),
                        testTag = "btn_age_verify_yes"
                    )

                    // NO Button - Accent Outline Red
                    LuxuryOutlinedButton(
                        text = "NO",
                        onClick = { hasRejected = true },
                        modifier = Modifier.weight(1f),
                        outlineColor = NeonStrawberry,
                        testTag = "btn_age_verify_no"
                    )
                }
            } else {
                // Access Blocked Area
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Access Blocked. Underage entry prohibited.",
                        color = NeonRed,
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    TextButton(onClick = { hasRejected = false }) {
                        Text("Verify again", color = GoldHighlight, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

// 3. Main Dashboard Screen (With tabs Home, Shop, Orders, Profile)
@Composable
fun MainDashboardScreen(viewModel: AppViewModel) {
    val activeTab by viewModel.activeTab.collectAsState()

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .navigationBarsPadding(), // Clean safety for emulator navigation pills
        containerColor = Color.Transparent,
        bottomBar = {
            Column {
                // Aesthetic subtle RGB bar line above dashboard navigator
                RGBLEDStrip()
                
                NavigationBar(
                    containerColor = DarkGreySurface,
                    contentColor = TextGraySecondary,
                    tonalElevation = 8.dp,
                    modifier = Modifier.height(64.dp)
                ) {
                    val tabs = listOf(
                        Triple(DashboardTab.HOME, "Home", Icons.Default.Home),
                        Triple(DashboardTab.SHOP, "Shop", Icons.Default.LocalMall),
                        Triple(DashboardTab.ORDERS, "Orders", Icons.Default.ReceiptLong),
                        Triple(DashboardTab.PROFILE, "Profile", Icons.Default.Person)
                    )

                    tabs.forEach { (tab, label, icon) ->
                        val isSelected = activeTab == tab
                        NavigationBarItem(
                            selected = isSelected,
                            onClick = { viewModel.selectTab(tab) },
                            icon = {
                                Icon(
                                    imageVector = icon,
                                    contentDescription = label,
                                    tint = if (isSelected) GoldHighlight else TextGraySecondary,
                                    modifier = Modifier.size(24.dp)
                                )
                            },
                            label = {
                                Text(
                                    text = label,
                                    color = if (isSelected) TextWhite else TextGraySecondary,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    letterSpacing = 0.5.sp,
                                    fontSize = 11.sp
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                indicatorColor = GoldPrimary.copy(alpha = 0.15f)
                            ),
                            modifier = Modifier.testTag("nav_tab_${label.lowercase()}")
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (activeTab) {
                DashboardTab.HOME -> HomeTabContent(viewModel)
                DashboardTab.SHOP -> ShopTabContent(viewModel)
                DashboardTab.ORDERS -> OrdersTabContent(viewModel)
                DashboardTab.PROFILE -> ProfileTabContent(viewModel)
            }
        }
    }
}

// Dashboard Tabs Implementations
@Composable
fun HomeTabContent(viewModel: AppViewModel) {
    val cart by viewModel.cart.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var activeFilterFlavor by remember { mutableStateOf<String?>(null) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .testTag("home_screen_tab"),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // TOP Header
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 20.dp, vertical = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "DEEP CLOUD",
                        color = Color.White,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 2.sp
                    )
                    Text(
                        text = "High-End Luxury Vapes Jordan",
                        color = GoldPrimary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 0.5.sp
                    )
                }

                // Interactive Cart Badge Trigger
                Box(
                    modifier = Modifier
                        .size(45.dp)
                        .background(DarkGreyCard, CircleShape)
                        .border(1.dp, ActiveBorderGlow, CircleShape)
                        .clickable { viewModel.navigateTo(Screen.Cart) }
                        .testTag("btn_cart_header"),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.ShoppingCart,
                        contentDescription = "Access shopping cart list",
                        tint = GoldHighlight,
                        modifier = Modifier.size(20.dp)
                    )
                    if (cart.isNotEmpty()) {
                        val totalCount = cart.sumOf { it.quantity }
                        Box(
                            modifier = Modifier
                                .size(18.dp)
                                .align(Alignment.TopEnd)
                                .background(NeonStrawberry, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = totalCount.toString(),
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        // Integrated Search Input directly in layout
        item {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp)
                    .testTag("home_search_bar"),
                placeholder = { Text("Search premium collections...", color = TextGrayMuted) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = GoldPrimary) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear search", tint = TextGraySecondary)
                        }
                    }
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = TextGraySecondary,
                    focusedBorderColor = GoldHighlight,
                    unfocusedBorderColor = ActiveBorderGlow,
                    focusedContainerColor = DarkGreyCard,
                    unfocusedContainerColor = DarkGreySurface
                ),
                shape = RoundedCornerShape(14.dp),
                singleLine = true
            )
        }

        // Horizontal Banner promotion Slider
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .padding(horizontal = 20.dp, vertical = 12.dp)
                    .clip(RoundedCornerShape(22.dp))
                    .border(1.dp, GoldHighlight.copy(alpha = 0.25f), RoundedCornerShape(22.dp)),
                contentAlignment = Alignment.BottomStart
            ) {
                // Generated dynamic promo banner
                Image(
                    painter = painterResource(id = R.drawable.img_banner_promo),
                    contentDescription = "Deep cloud horizontal slider design",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )

                // High contrast dark overlay gradient inside slider
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(Color.Transparent, PureBlack.copy(alpha = 0.9f))
                            )
                        )
                )

                // Strobe glowing bottom indicator line
                RGBLEDStrip(modifier = Modifier.align(Alignment.BottomCenter))

                Column(
                    modifier = Modifier
                        .padding(16.dp)
                        .offset(y = (-4).dp)
                ) {
                    Box(
                        modifier = Modifier
                            .background(GoldHighlight, RoundedCornerShape(6.dp))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = "80,000 PUFFS",
                            color = PureBlack,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "DEEP CLOUD JORDAN — ELITE EDITION",
                        color = Color.White,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.ExtraBold
                    )

                    Text(
                        text = "Experience dual pre-heating mesh coil system",
                        color = TextGraySecondary,
                        fontSize = 11.sp
                    )
                }
            }
        }

        // Flavors horizontal reel filter
        item {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "EXPLORE FLAVOR NOTES",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.2.sp,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)
                )

                val flavors = listOf(
                    FlavorOption("All", GoldPrimary, ""),
                    FlavorOption("Royal Mint", NeonMint, ""),
                    FlavorOption("Imperial Berry", NeonStrawberry, ""),
                    FlavorOption("Golden Mango", NeonMango, ""),
                    FlavorOption("Vintage Blue", NeonBlueberry, ""),
                    FlavorOption("Ice Grape", NeonPurple, "")
                )

                LazyRow(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(flavors) { f ->
                        val isSelected = if (f.name == "All") activeFilterFlavor == null else activeFilterFlavor == f.name
                        val colorGlow = if (f.name == "All") GoldPrimary else f.hexColor

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(30.dp))
                                .background(if (isSelected) colorGlow.copy(alpha = 0.15f) else DarkGreyCard)
                                .border(
                                    width = if (isSelected) 1.5.dp else 1.dp,
                                    color = if (isSelected) colorGlow else ActiveBorderGlow,
                                    shape = RoundedCornerShape(30.dp)
                                )
                                .clickable {
                                    activeFilterFlavor = if (f.name == "All") null else f.name
                                }
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                if (f.name != "All") {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .background(f.hexColor, CircleShape)
                                    )
                                }
                                Text(
                                    text = f.name.uppercase(),
                                    color = if (isSelected) Color.White else TextGraySecondary,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                )
                            }
                        }
                    }
                }
            }
        }

        // Featured products list title
        item {
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "FEATURED HARDWARE SYSTEMS",
                color = GoldPrimary,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.2.sp,
                modifier = Modifier.padding(horizontal = 20.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
        }

        // Dynamic Filtering
        val filtered = viewModel.products.filter { prod ->
            val matchQuery = prod.name.contains(searchQuery, ignoreCase = true) || prod.description.contains(searchQuery, ignoreCase = true)
            val matchFlavor = activeFilterFlavor == null || prod.flavors.any { it.name == activeFilterFlavor }
            matchQuery && matchFlavor
        }

        if (filtered.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Outlined.SentimentVeryDissatisfied, contentDescription = "No vape components found", tint = TextGrayMuted, modifier = Modifier.size(50.dp))
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("No premium hardware matches filters.", color = TextGraySecondary)
                    }
                }
            }
        } else {
            // Render grid using items layout
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    filtered.forEach { product ->
                        ProductItemCard(
                            product = product,
                            onProductClick = { viewModel.navigateTo(Screen.ProductDetails(product)) },
                            onAddToCartClick = {
                                viewModel.addToCart(product, product.defaultFlavor, 1)
                            }
                        )
                    }
                }
            }
        }

        // Offers and brand standards section
        item {
            Spacer(modifier = Modifier.height(24.dp))
            Text(
                text = "THE DEEP CLOUD GUARANTEE",
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.5.sp,
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 6.dp)
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                listOf(
                    Triple(Icons.Default.Verified, "AUTHENTIC", "100% Import Guarantee"),
                    Triple(Icons.Default.LocalShipping, "DELIVERY", "Lobby to doorstep"),
                    Triple(Icons.Default.HeadsetMic, "24/7 HELPDESK", "VIP Direct Support")
                ).forEach { (icon, h, sub) ->
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .background(DarkGreyCard, RoundedCornerShape(12.dp))
                            .border(1.dp, ActiveBorderGlow, RoundedCornerShape(12.dp))
                            .padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(icon, contentDescription = h, tint = GoldHighlight, modifier = Modifier.size(24.dp))
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(h, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text(sub, color = TextGraySecondary, fontSize = 9.sp, textAlign = TextAlign.Center)
                    }
                }
            }
        }
    }
}

// Singular Product layout list item
@Composable
fun ProductItemCard(
    product: VapeProduct,
    onProductClick: () -> Unit,
    onAddToCartClick: () -> Unit
) {
    var isQuickAdded by remember { mutableStateOf(false) }

    LuxuryGlowingBorderCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onProductClick)
            .testTag("product_card_${product.id}"),
        glowColor = if (product.rgbLighting) NeonCyan else GoldPrimary
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Visual product avatar
            Box(
                modifier = Modifier
                    .size(105.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(PureBlack)
                    .border(1.dp, ActiveBorderGlow, RoundedCornerShape(14.dp))
            ) {
                Image(
                    painter = painterResource(id = product.imageResId),
                    contentDescription = product.name,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Inside
                )

                if (product.rgbLighting) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .fillMaxWidth()
                            .height(4.dp)
                            .background(
                                Brush.horizontalGradient(
                                    listOf(NeonCyan, NeonStrawberry, NeonMango)
                                )
                            )
                    )
                }
            }

            // Info column
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = product.name,
                    color = Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.ExtraBold
                )

                Text(
                    text = product.modelTag,
                    color = GoldHighlight,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp
                )

                Spacer(modifier = Modifier.height(6.dp))

                // Specs line
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .background(PureBlack, RoundedCornerShape(4.dp))
                            .border(0.5.dp, GoldPrimary.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text("${product.puffs} puffs", color = TextGraySecondary, fontSize = 9.sp)
                    }
                    Box(
                        modifier = Modifier
                            .background(PureBlack, RoundedCornerShape(4.dp))
                            .border(0.5.dp, GoldPrimary.copy(alpha = 0.3f), RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(product.nicotine, color = TextGraySecondary, fontSize = 9.sp)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "$${product.price}0",
                        color = Color.White,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Black
                    )

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isQuickAdded) NeonMint else GoldPrimary)
                            .clickable {
                                onAddToCartClick()
                                isQuickAdded = true
                            }
                            .padding(horizontal = 14.dp, vertical = 6.dp)
                            .testTag("btn_quick_add_${product.id}"),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (isQuickAdded) "ADDED ✓" else "+ CART",
                            color = PureBlack,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                }
            }
        }
    }
}

// 3B. Shop Tab Full listing Content
@Composable
fun ShopTabContent(viewModel: AppViewModel) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .padding(top = 16.dp)
            .testTag("shop_tab_content")
    ) {
        Text(
            text = "DEEP CLOUD SYSTEM CATALOG",
            color = Color.White,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.5.sp,
            modifier = Modifier.padding(horizontal = 20.dp)
        )
        Text(
            text = "Select high-end pod hardware and rich salt mixtures",
            color = TextGraySecondary,
            fontSize = 12.sp,
            modifier = Modifier.padding(horizontal = 20.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(start = 16.dp, top = 0.dp, end = 16.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(viewModel.products) { product ->
                ProductItemCard(
                    product = product,
                    onProductClick = { viewModel.navigateTo(Screen.ProductDetails(product)) },
                    onAddToCartClick = {
                        viewModel.addToCart(product, product.defaultFlavor, 1)
                    }
                )
            }
        }
    }
}

// 3C. Custom Orders Tab Content
@Composable
fun OrdersTabContent(viewModel: AppViewModel) {
    val orders by viewModel.ordersList.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .padding(top = 16.dp)
            .testTag("orders_tab_content")
    ) {
        Text(
            text = "MY COMMITTED ORDERS",
            color = Color.White,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.5.sp,
            modifier = Modifier.padding(horizontal = 20.dp)
        )
        Text(
            text = "Real-time dispatch, transit, and delivery progress logs",
            color = TextGraySecondary,
            fontSize = 12.sp,
            modifier = Modifier.padding(horizontal = 20.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        if (orders.isEmpty()) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.ReceiptLong,
                        contentDescription = "No recent receipts",
                        tint = TextGrayMuted,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("No order transactions submitted.", color = TextGraySecondary, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("Your placed vape checkouts will list here.", color = TextGrayMuted, fontSize = 12.sp)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(start = 16.dp, top = 0.dp, end = 16.dp, bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(orders) { order ->
                    LuxuryGlowingBorderCard(
                        glowColor = when (order.status) {
                            TrackingStatus.ORDER_PLACED -> GoldPrimary
                            TrackingStatus.PREPARING -> NeonMango
                            TrackingStatus.OUT_FOR_DELIVERY -> NeonCyan
                            TrackingStatus.DELIVERED -> NeonMint
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { viewModel.navigateTo(Screen.OrderTracking(order.id)) }
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "ORDER #${order.id}",
                                    color = Color.White,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )

                                Box(
                                    modifier = Modifier
                                        .background(
                                            when (order.status) {
                                                TrackingStatus.ORDER_PLACED -> GoldPrimary.copy(alpha = 0.15f)
                                                TrackingStatus.PREPARING -> NeonMango.copy(alpha = 0.15f)
                                                TrackingStatus.OUT_FOR_DELIVERY -> NeonCyan.copy(alpha = 0.15f)
                                                TrackingStatus.DELIVERED -> NeonMint.copy(alpha = 0.15f)
                                            },
                                            RoundedCornerShape(6.dp)
                                        )
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text(
                                        text = order.status.name.replace("_", " "),
                                        color = when (order.status) {
                                            TrackingStatus.ORDER_PLACED -> GoldHighlight
                                            TrackingStatus.PREPARING -> NeonMango
                                            TrackingStatus.OUT_FOR_DELIVERY -> NeonCyan
                                            TrackingStatus.DELIVERED -> NeonMint
                                        },
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                }
                            }

                            Divider(color = ActiveBorderGlow, thickness = 1.dp, modifier = Modifier.padding(vertical = 12.dp))

                            Text(
                                text = "Placed: ${order.timestamp}",
                                color = TextGraySecondary,
                                fontSize = 12.sp
                            )

                            Text(
                                text = "Items: ${order.items.sumOf { it.quantity }} products customized",
                                color = TextGraySecondary,
                                fontSize = 12.sp
                            )

                            Spacer(modifier = Modifier.height(10.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Est. Total",
                                    color = TextGraySecondary,
                                    fontSize = 13.sp
                                )
                                Text(
                                    text = "$${order.totalPrice}0",
                                    color = GoldHighlight,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Black
                                )
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier.align(Alignment.End)
                            ) {
                                Text("LATEST STATUS LOGS", color = TextGrayMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                Icon(Icons.Default.ArrowRightAlt, contentDescription = "Review step tracker logs", tint = GoldPrimary, modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

// 3D. Custom Profile Tab Content with user metadata + loyalty
@Composable
fun ProfileTabContent(viewModel: AppViewModel) {
    val profile by viewModel.userProfile.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .padding(start = 20.dp, top = 20.dp, end = 20.dp)
            .testTag("profile_tab_content")
    ) {
        Text(
            text = "MY DEEP CLOUD PROFILE",
            color = Color.White,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Black,
            letterSpacing = 1.5.sp
        )
        Spacer(modifier = Modifier.height(20.dp))

        // Profile Avatar and Identity Area
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .background(GoldPrimary.copy(alpha = 0.15f), CircleShape)
                    .border(2.dp, GoldHighlight, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = "User Avatar",
                    tint = GoldHighlight,
                    modifier = Modifier.size(36.dp)
                )
            }

            Column {
                Text(
                    text = profile.name,
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = profile.phone,
                    color = TextGraySecondary,
                    fontSize = 13.sp
                )
            }
        }

        // Luxury Gold Points Ribbon Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(goldGradientBrush())
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "LOYALTY LEVEL: AMBER GOLD",
                        color = PureBlack,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${profile.loyaltyPoints} CLOUD POINTS",
                        color = PureBlack,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black
                    )
                }

                Icon(
                    imageVector = Icons.Default.Stars,
                    contentDescription = "Cloud Star",
                    tint = PureBlack,
                    modifier = Modifier.size(36.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Profile Navigation links list
        listOf(
            Triple(Icons.Outlined.ReceiptLong, "My Orders History") { viewModel.selectTab(DashboardTab.ORDERS) },
            Triple(Icons.Outlined.Settings, "Account Settings") {},
            Triple(Icons.Default.Policy, "T&C and Age Disclaimers") {},
            Triple(Icons.Outlined.Logout, "Exit Application Session") { viewModel.logout() }
        ).forEach { (icon, name, click) ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(onClick = click)
                    .padding(vertical = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Icon(icon, contentDescription = name, tint = GoldPrimary, modifier = Modifier.size(22.dp))
                    Text(name, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                }
                Icon(Icons.Default.ChevronRight, contentDescription = "Proceed", tint = TextGrayMuted, modifier = Modifier.size(20.dp))
            }
            Divider(color = ActiveBorderGlow, thickness = 0.5.dp)
        }
    }
}

// 4. Product Details Screen
@Composable
fun ProductDetailsScreen(viewModel: AppViewModel, product: VapeProduct) {
    var selectedFlavor by remember { mutableStateOf(product.defaultFlavor) }
    var quantity by remember { mutableStateOf(1) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .testTag("product_details_screen_${product.id}")
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = { viewModel.navigateBack() },
                    modifier = Modifier
                        .background(DarkGreyCard, CircleShape)
                        .border(1.dp, ActiveBorderGlow, CircleShape)
                ) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Return", tint = GoldHighlight)
                }

                Text(
                    text = "SPECIFICATIONS",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.2.sp
                )

                IconButton(
                    onClick = { viewModel.navigateTo(Screen.Cart) },
                    modifier = Modifier
                        .background(DarkGreyCard, CircleShape)
                        .border(1.dp, ActiveBorderGlow, CircleShape)
                ) {
                    Icon(Icons.Default.ShoppingCart, contentDescription = "View Cart", tint = GoldHighlight)
                }
            }

            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentPadding = PaddingValues(bottom = 120.dp)
            ) {
                // Interactive Hero Product display featuring flavor-dependent active halos
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(280.dp)
                            .drawBehind {
                                // Draw high-intensity soft halo pulsing light in the flavor's unique tint
                                drawCircle(
                                    brush = Brush.radialGradient(
                                        colors = listOf(selectedFlavor.hexColor.copy(alpha = 0.22f), Color.Transparent),
                                        center = center,
                                        radius = size.width * 0.45f
                                    )
                                )
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Image(
                            painter = painterResource(id = product.imageResId),
                            contentDescription = product.name,
                            modifier = Modifier
                                .fillMaxHeight(0.85f)
                                .fillMaxWidth(0.85f),
                            contentScale = ContentScale.Inside
                        )

                        // If RGB device, align a color band
                        if (product.rgbLighting) {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.BottomCenter)
                                    .fillMaxWidth(0.6f)
                                    .padding(bottom = 16.dp)
                                    .clip(RoundedCornerShape(10.dp))
                            ) {
                                RGBLEDStrip(height = 6.dp)
                            }
                        }
                    }
                }

                // Details Text Section
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 24.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = product.name,
                                    color = Color.White,
                                    style = MaterialTheme.typography.displayMedium,
                                    fontWeight = FontWeight.Black
                                )
                                Text(
                                    text = product.modelTag,
                                    color = GoldPrimary,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    letterSpacing = 1.sp
                                )
                            }

                            // Dynamic interactive stars rating box
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                modifier = Modifier
                                    .background(DarkGreyCard, RoundedCornerShape(8.dp))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Icon(Icons.Default.Star, contentDescription = null, tint = GoldHighlight, modifier = Modifier.size(16.dp))
                                Text(product.rating.toString(), color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Specs key metrics badges raw display
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            listOf(
                                Pair(Icons.Default.Cloud, "${product.puffs}\nPUFFS"),
                                Pair(Icons.Default.WaterDrop, "${product.eLiquid}\nJUICE"),
                                Pair(Icons.Default.Science, "${product.nicotine}\nNICOTINE"),
                                Pair(Icons.Default.Speed, if (product.dualMode) "MTL/DTL\nDUAL" else "MTL ONLY\nSINGLE")
                            ).forEach { (icon, desc) ->
                                Column(
                                    modifier = Modifier
                                        .weight(1f)
                                        .background(DarkGreyCard, RoundedCornerShape(12.dp))
                                        .border(0.5.dp, ActiveBorderGlow, RoundedCornerShape(12.dp))
                                        .padding(vertical = 10.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(icon, contentDescription = null, tint = GoldHighlight, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = desc,
                                        color = TextGraySecondary,
                                        fontSize = 8.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        textAlign = TextAlign.Center,
                                        lineHeight = 11.sp
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        Text(
                            text = "PRODUCT DESIGN DECRYPTION",
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.5.sp
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = product.description,
                            color = TextGraySecondary,
                            fontSize = 13.sp,
                            lineHeight = 20.sp
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        // Interactive Flavor choice picker
                        Text(
                            text = "SELECT ACTIVE COMPOSABLE FLAVOR",
                            color = GoldHighlight,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.5.sp
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        // Render Flavor Options Row buttons
                        Column(
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            product.flavors.forEach { flv ->
                                val isActive = selectedFlavor.name == flv.name
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(if (isActive) flv.hexColor.copy(alpha = 0.12f) else DarkGreyCard)
                                        .border(
                                            width = if (isActive) 1.5.dp else 1.dp,
                                            color = if (isActive) flv.hexColor else ActiveBorderGlow,
                                            shape = RoundedCornerShape(14.dp)
                                        )
                                        .clickable { selectedFlavor = flv }
                                        .padding(horizontal = 16.dp, vertical = 12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(14.dp)
                                                .background(flv.hexColor, CircleShape)
                                        )
                                        Column {
                                            Text(
                                                text = flv.name.uppercase(),
                                                color = Color.White,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Text(
                                                text = flv.description,
                                                color = TextGraySecondary,
                                                fontSize = 11.sp
                                            )
                                        }
                                    }

                                    if (isActive) {
                                        Box(
                                            modifier = Modifier
                                                .size(20.dp)
                                                .background(flv.hexColor, CircleShape),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(Icons.Default.Check, contentDescription = "Active Selection", tint = PureBlack, modifier = Modifier.size(12.dp))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Bottom Purchase bar
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(DarkGreySurface)
                .border(2.dp, ActiveBorderGlow, RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp))
                .padding(horizontal = 24.dp, vertical = 20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("TOTAL UNIT VALUATION", color = TextGraySecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Text("$${product.price * quantity}0", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Black)
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // [+ -] Controls
                    Row(
                        modifier = Modifier
                            .background(PureBlack, RoundedCornerShape(10.dp))
                            .border(1.dp, ActiveBorderGlow, RoundedCornerShape(10.dp))
                            .padding(horizontal = 4.dp, vertical = 2.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        IconButton(onClick = { if (quantity > 1) quantity-- }) {
                            Icon(Icons.Default.Remove, contentDescription = "Decrease", tint = Color.White)
                        }
                        Text(quantity.toString(), color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        IconButton(onClick = { quantity++ }) {
                            Icon(Icons.Default.Add, contentDescription = "Increase", tint = Color.White)
                        }
                    }

                    // Add button
                    LuxuryGradientButton(
                        text = "+ TO CART",
                        onClick = {
                            viewModel.addToCart(product, selectedFlavor, quantity)
                            viewModel.navigateTo(Screen.Cart)
                        },
                        modifier = Modifier.width(130.dp),
                        testTag = "btn_add_to_cart_details"
                    )
                }
            }
        }
    }
}

// 5. Cart Screen
@Composable
fun CartScreen(viewModel: AppViewModel) {
    val items by viewModel.cart.collectAsState()
    val rawPrice by viewModel.totalCartPrice.collectAsState(0.0)
    val shipping = 5.0
    val totalValuation = if (items.isNotEmpty()) rawPrice + shipping else 0.0

    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .testTag("cart_screen")
    ) {
        // Simple Back action Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = { viewModel.navigateBack() },
                modifier = Modifier
                    .background(DarkGreyCard, CircleShape)
                    .border(1.dp, ActiveBorderGlow, CircleShape)
            ) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Go back", tint = GoldHighlight)
            }

            Text(
                text = "MY SELECTED CLOUDS",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.2.sp
            )

            // Placeholder to align text center
            Spacer(modifier = Modifier.size(40.dp))
        }

        if (items.isEmpty()) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.ShoppingCart, contentDescription = "Backpack empty", tint = TextGrayMuted, modifier = Modifier.size(64.dp))
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Your cart is completely clear.", color = TextGraySecondary, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(20.dp))
                    LuxuryGradientButton(
                        text = "EXPLORE CATALOG",
                        onClick = {
                            viewModel.selectTab(DashboardTab.HOME)
                            viewModel.navigateTo(Screen.MainDashboard)
                        },
                        modifier = Modifier.width(200.dp)
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(start = 16.dp, top = 0.dp, end = 16.dp, bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(items) { item ->
                    LuxuryGlowingBorderCard(
                        glowColor = item.selectedFlavor.hexColor
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(72.dp)
                                    .background(PureBlack, RoundedCornerShape(10.dp))
                                    .border(1.dp, ActiveBorderGlow, RoundedCornerShape(10.dp))
                            ) {
                                Image(
                                    painter = painterResource(id = item.product.imageResId),
                                    contentDescription = item.product.name,
                                    modifier = Modifier.fillMaxSize()
                                )
                            }

                            Column(modifier = Modifier.weight(1f)) {
                                Text(item.product.name, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Box(modifier = Modifier.size(8.dp).background(item.selectedFlavor.hexColor, CircleShape))
                                    Text(item.selectedFlavor.name.uppercase(), color = TextGraySecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                                Text("$${item.product.price}0 each", color = GoldPrimary, fontSize = 11.sp)
                            }

                            // Inc/Dec modifiers or direct remove
                            Column(horizontalAlignment = Alignment.End) {
                                IconButton(onClick = { viewModel.removeCartItem(item.product, item.selectedFlavor) }) {
                                    Icon(Icons.Default.Delete, contentDescription = "Drop Item", tint = NeonStrawberry)
                                }

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    IconButton(
                                        onClick = { viewModel.updateCartQuantity(item.product, item.selectedFlavor, -1) },
                                        modifier = Modifier.size(28.dp).background(PureBlack, CircleShape)
                                    ) {
                                        Icon(Icons.Default.Remove, contentDescription = "Dec", tint = Color.White, modifier = Modifier.size(14.dp))
                                    }
                                    Text(item.quantity.toString(), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                    IconButton(
                                        onClick = { viewModel.updateCartQuantity(item.product, item.selectedFlavor, 1) },
                                        modifier = Modifier.size(28.dp).background(PureBlack, CircleShape)
                                    ) {
                                        Icon(Icons.Default.Add, contentDescription = "Inc", tint = Color.White, modifier = Modifier.size(14.dp))
                                    }
                                }
                            }
                        }
                    }
                }

                // Summary Calculation breakdown card
                item {
                    Spacer(modifier = Modifier.height(12.dp))
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(DarkGreyCard, RoundedCornerShape(16.dp))
                            .border(1.dp, ActiveBorderGlow, RoundedCornerShape(16.dp))
                            .padding(16.dp)
                    ) {
                        Text("PAYMENT CALCULATION BREAKDOWN", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.2.sp)
                        Spacer(modifier = Modifier.height(12.dp))

                        listOf(
                            Pair("Unite Subtotal", "$${rawPrice}0"),
                            Pair("Premium Security Fast Cargo Shipping", "$${shipping}0"),
                            Pair("Taxes & Custom Fees Included", "FREE (GOLD)")
                        ).forEach { (h, v) ->
                            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(h, color = TextGraySecondary, fontSize = 12.sp)
                                Text(v, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Divider(color = ActiveBorderGlow, thickness = 1.dp, modifier = Modifier.padding(vertical = 12.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Total Sum Due", color = GoldHighlight, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text("$${totalValuation}0", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Black)
                        }
                    }
                }

                // Check out navigation CTA
                item {
                    Spacer(modifier = Modifier.height(12.dp))
                    LuxuryGradientButton(
                        text = "PROCEED TO SECURE CHECKOUT ($${totalValuation}0)",
                        onClick = { viewModel.navigateTo(Screen.Checkout) },
                        modifier = Modifier.fillMaxWidth(),
                        testTag = "btn_proceed_checkout"
                    )
                }
            }
        }
    }
}

// 6. Checkout Screen
@Composable
fun CheckoutScreen(viewModel: AppViewModel) {
    var fullName by remember { mutableStateOf("Samer Al-Jordan") }
    var phoneNumber by remember { mutableStateOf("+962 79 123 4567") }
    var locationAddress by remember { mutableStateOf("Amman Circle 5, Luxury Tower 3A, Apt 11") }
    var paymentMethod by remember { mutableStateOf("CASH_ON_DELIVERY") }

    val rawPrice by viewModel.totalCartPrice.collectAsState(0.0)
    val totalComputed = rawPrice + 5.0

    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .testTag("checkout_screen")
    ) {
        // Back Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = { viewModel.navigateBack() },
                modifier = Modifier
                    .background(DarkGreyCard, CircleShape)
                    .border(1.dp, ActiveBorderGlow, CircleShape)
            ) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Return", tint = GoldHighlight)
            }

            Text(
                text = "COMMITTING CHECKOUT",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.2.sp
            )

            Spacer(modifier = Modifier.size(40.dp))
        }

        LazyColumn(
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(start = 20.dp, top = 0.dp, end = 20.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Recipient Data Card inputs
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(DarkGreyCard, RoundedCornerShape(16.dp))
                        .border(1.dp, ActiveBorderGlow, RoundedCornerShape(16.dp))
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("DELIVERY RECIPIENT INFORMATION", color = GoldHighlight, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)

                    // FullName Field
                    OutlinedTextField(
                        value = fullName,
                        onValueChange = { fullName = it },
                        modifier = Modifier.fillMaxWidth().testTag("input_fullname"),
                        label = { Text("Full Name", color = TextGraySecondary) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White, unfocusedTextColor = TextGraySecondary,
                            focusedBorderColor = GoldHighlight, unfocusedBorderColor = ActiveBorderGlow
                        ),
                        singleLine = true
                    )

                    // Phone Number Field
                    OutlinedTextField(
                        value = phoneNumber,
                        onValueChange = { phoneNumber = it },
                        modifier = Modifier.fillMaxWidth().testTag("input_phone"),
                        label = { Text("Phone Number", color = TextGraySecondary) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White, unfocusedTextColor = TextGraySecondary,
                            focusedBorderColor = GoldHighlight, unfocusedBorderColor = ActiveBorderGlow
                        ),
                        singleLine = true
                    )
                }
            }

            // Geographical pinpoint map visual mock
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(DarkGreyCard, RoundedCornerShape(16.dp))
                        .border(1.dp, ActiveBorderGlow, RoundedCornerShape(16.dp))
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("GEOGRAPHICAL LOCATOR", color = GoldHighlight, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)

                    // visual canvas mapping representing maps integration
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(140.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(PureBlack)
                            .border(1.dp, ActiveBorderGlow, RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        // Drawing procedurally elegant stylized vector cyber grid maps representation
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            val w = size.width
                            val h = size.height
                            // Draw ambient grid
                            val gap = 30f
                            var x = 0f
                            while (x < w) {
                                drawLine(Color(0xFF1F1F1F), Offset(x, 0f), Offset(x, h), strokeWidth = 1f)
                                x += gap
                            }
                            var y = 0f
                            while (y < h) {
                                drawLine(Color(0xFF1F1F1F), Offset(0f, y), Offset(w, y), strokeWidth = 1f)
                                y += gap
                            }
                            // Draw gold luxury route circles
                            drawCircle(GoldPrimary.copy(alpha = 0.15f), radius = 50f, center = Offset(w*0.5f, h*0.5f))
                            drawCircle(GoldHighlight, radius = 8f, center = Offset(w*0.5f, h*0.5f))
                        }

                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.padding(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .background(PureBlack.copy(alpha = 0.75f), RoundedCornerShape(8.dp))
                                    .padding(horizontal = 8.dp, vertical = 4.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Icon(Icons.Filled.MyLocation, contentDescription = null, tint = NeonCyan, modifier = Modifier.size(12.dp))
                                    Text("GOOGLE MAPS LOCKED", color = NeonCyan, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    OutlinedTextField(
                        value = locationAddress,
                        onValueChange = { locationAddress = it },
                        modifier = Modifier.fillMaxWidth().testTag("input_address"),
                        label = { Text("Exact Delivery Address", color = TextGraySecondary) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White, unfocusedTextColor = TextGraySecondary,
                            focusedBorderColor = GoldHighlight, unfocusedBorderColor = ActiveBorderGlow
                        )
                    )
                }
            }

            // Payment modes selector
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(DarkGreyCard, RoundedCornerShape(16.dp))
                        .border(1.dp, ActiveBorderGlow, RoundedCornerShape(16.dp))
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("CHOOSE SETTLEMENT METHOD", color = GoldHighlight, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)

                    listOf(
                        Pair("CASH_ON_DELIVERY", "Cash on Delivery (دفع عند الاستلام)"),
                        Pair("ONLINE_GOLD_CARD", "Premium Gold Credit Card (Online)")
                    ).forEach { (method, desc) ->
                        val isSelected = paymentMethod == method
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isSelected) GoldPrimary.copy(alpha = 0.08f) else PureBlack)
                                .border(1.dp, if (isSelected) GoldHighlight else ActiveBorderGlow, RoundedCornerShape(10.dp))
                                .clickable { paymentMethod = method }
                                .padding(horizontal = 14.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                Icon(
                                    imageVector = if (method == "CASH_ON_DELIVERY") Icons.Default.Payments else Icons.Default.CreditCard,
                                    contentDescription = null,
                                    tint = if (isSelected) GoldHighlight else TextGraySecondary,
                                    modifier = Modifier.size(20.dp)
                                )
                                Text(desc, color = if (isSelected) Color.White else TextGraySecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                            RadioButton(
                                selected = isSelected,
                                onClick = { paymentMethod = method },
                                colors = RadioButtonDefaults.colors(selectedColor = GoldHighlight, unselectedColor = ActiveBorderGlow)
                            )
                        }
                    }
                }
            }

            // Bottom checkout submission triggers
            item {
                Spacer(modifier = Modifier.height(10.dp))
                LuxuryGradientButton(
                    text = "CONFIRM & PLACE ORDER NOW ($$totalComputed 0)",
                    onClick = {
                        if (fullName.isNotBlank() && phoneNumber.isNotBlank()) {
                            viewModel.placeOrder(
                                fullName = fullName,
                                phoneNumber = phoneNumber,
                                address = locationAddress,
                                paymentMethod = paymentMethod
                            )
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    testTag = "btn_place_order"
                )
            }
        }
    }
}

// 7. Order Tracking Screen
@Composable
fun OrderTrackingScreen(viewModel: AppViewModel, orderId: String) {
    val orders by viewModel.ordersList.collectAsState()
    val matchingOrder = orders.find { it.id == orderId }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .testTag("tracking_screen")
    ) {
        // Back header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = { viewModel.navigateTo(Screen.MainDashboard) },
                modifier = Modifier
                    .background(DarkGreyCard, CircleShape)
                    .border(1.dp, ActiveBorderGlow, CircleShape)
            ) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Go dashboard", tint = GoldHighlight)
            }

            Text(
                text = "DISPATCH REGISTRATION STATUS",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.2.sp
            )

            IconButton(
                onClick = { viewModel.navigateTo(Screen.MainDashboard) },
                modifier = Modifier
                    .background(DarkGreyCard, CircleShape)
                    .border(1.dp, ActiveBorderGlow, CircleShape)
            ) {
                Icon(Icons.Default.Close, contentDescription = "Exit to main", tint = GoldHighlight)
            }
        }

        if (matchingOrder == null) {
            Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                Text("Order details not accessible.", color = TextGraySecondary)
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(start = 20.dp, top = 0.dp, end = 20.dp, bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Tracking Status Glowing Banner
                item {
                    LuxuryGlowingBorderCard(
                        glowColor = when (matchingOrder.status) {
                            TrackingStatus.ORDER_PLACED -> GoldPrimary
                            TrackingStatus.PREPARING -> NeonMango
                            TrackingStatus.OUT_FOR_DELIVERY -> NeonCyan
                            TrackingStatus.DELIVERED -> NeonMint
                        }
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                            Text(
                                text = "ORDER ID: #${matchingOrder.id}",
                                color = GoldHighlight,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = when (matchingOrder.status) {
                                    TrackingStatus.ORDER_PLACED -> "ORDER VERIFIED & COMMITTED"
                                    TrackingStatus.PREPARING -> "PREPARING PREMIUM HARDWARE"
                                    TrackingStatus.OUT_FOR_DELIVERY -> "COURIER FLYING IN TRANSIT"
                                    TrackingStatus.DELIVERED -> "SECURELY DELIVERED — ENJOY ✓"
                                },
                                color = Color.White,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Black,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "Estimated Cargo Transit Arrival: ${if (matchingOrder.status == TrackingStatus.DELIVERED) "Completed" else "25 - 40 Mins"}",
                                color = TextGraySecondary,
                                fontSize = 12.sp
                            )
                        }
                    }
                }

                // Step sequence indicator
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(DarkGreyCard, RoundedCornerShape(20.dp))
                            .border(1.dp, ActiveBorderGlow, RoundedCornerShape(20.dp))
                            .padding(24.dp)
                    ) {
                        val stages = listOf(
                            Triple(TrackingStatus.ORDER_PLACED, "Order Committed", "Verified successfully in database log"),
                            Triple(TrackingStatus.PREPARING, "Processing & Sealing", "Sterile packaging & custom mesh preheats"),
                            Triple(TrackingStatus.OUT_FOR_DELIVERY, "Transit Courier dispatched", "Premium high speed cargo logistics active"),
                            Triple(TrackingStatus.DELIVERED, "Delivered to Lobby", "Delivered directly. Proof verified.")
                        )

                        stages.forEachIndexed { index, (statusStage, title, desc) ->
                            val isCompletedOrActive = matchingOrder.status.ordinal >= statusStage.ordinal
                            val isCurrent = matchingOrder.status == statusStage
                            val timeStr = matchingOrder.statusHistory[statusStage] ?: "--:--"

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.Top
                            ) {
                                // Left Visual Line Sequence
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.width(32.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(24.dp)
                                            .background(
                                                if (isCompletedOrActive) {
                                                    if (isCurrent) GoldHighlight else GoldPrimary
                                                } else {
                                                    PureBlack
                                                },
                                                CircleShape
                                            )
                                            .border(
                                                width = 1.5.dp,
                                                color = if (isCompletedOrActive) GoldHighlight else ActiveBorderGlow,
                                                shape = CircleShape
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        if (isCompletedOrActive) {
                                            Icon(Icons.Default.Check, contentDescription = null, tint = PureBlack, modifier = Modifier.size(12.dp))
                                        }
                                    }

                                    if (index < stages.size - 1) {
                                        Box(
                                            modifier = Modifier
                                                .width(2.dp)
                                                .height(45.dp)
                                                .background(
                                                    if (matchingOrder.status.ordinal > statusStage.ordinal) GoldPrimary else ActiveBorderGlow
                                                )
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.width(16.dp))

                                // Right status descriptions
                                Column(modifier = Modifier.weight(1f).padding(bottom = 16.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            text = title,
                                            color = if (isCompletedOrActive) Color.White else TextGrayMuted,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = timeStr,
                                            color = if (isCompletedOrActive) GoldPrimary else TextGrayMuted,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(3.dp))
                                    Text(
                                        text = desc,
                                        color = if (isCompletedOrActive) TextGraySecondary else TextGrayMuted,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }
                    }
                }

                // Summary items list inside order
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(DarkGreyCard, RoundedCornerShape(16.dp))
                            .border(1.dp, ActiveBorderGlow, RoundedCornerShape(16.dp))
                            .padding(16.dp)
                    ) {
                        Text("MANIFEST ITEM DETAILS", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.2.sp)
                        Spacer(modifier = Modifier.height(10.dp))

                        matchingOrder.items.forEach { line ->
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Box(modifier = Modifier.size(8.dp).background(line.selectedFlavor.hexColor, CircleShape))
                                    Text("${line.product.name} (QTY: ${line.quantity})", color = TextGraySecondary, fontSize = 12.sp)
                                }
                                Text("$${line.product.price * line.quantity}0", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Divider(color = ActiveBorderGlow, thickness = 1.dp, modifier = Modifier.padding(vertical = 10.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Total Billing Sum", color = TextGraySecondary, fontSize = 12.sp)
                            Text("$${matchingOrder.totalPrice}0", color = GoldHighlight, fontSize = 15.sp, fontWeight = FontWeight.Black)
                        }
                    }
                }

                // Call direct support CTA
                item {
                    LuxuryOutlinedButton(
                        text = "CALL VIP COURIER LINE",
                        onClick = {},
                        modifier = Modifier.fillMaxWidth(),
                        outlineColor = NeonCyan
                    )
                }
            }
        }
    }
}
